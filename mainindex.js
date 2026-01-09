// npm i stellar-sdk dotenv
require('dotenv').config();
const StellarSdk = require('stellar-sdk');

/** ---------- CONFIG ---------- */
const HORIZON_URL        = process.env.HORIZON_URL || 'https://api.mainnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Pi Network';
const SENDER_SECRET      = "SCKT77JCHANDQFDGB5VHM5VVLVU3DDEEK354YSDHAKLTNBZXHAACQ22L";
const RECIPIENT          = process.env.RECIPIENT;
const BUFFER_STROOPS     = BigInt(process.env.BUFFER_STROOPS || 10000n);

const RETRY_ATTEMPTS     = Number(process.env.RETRY_ATTEMPTS || 5);
const RETRY_BASE_DELAY   = Number(process.env.RETRY_BASE_DELAY || 500);

// Channel accounts
const CHANNEL_SECRETS = (process.env.CHANNEL_SECRETS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (!SENDER_SECRET || !RECIPIENT) {
  console.error('❌ .env এ SENDER_SECRET এবং RECIPIENT লাগবে।'); process.exit(1);
}

const server       = new StellarSdk.Server(HORIZON_URL);
const mainKeypair  = StellarSdk.Keypair.fromSecret(SENDER_SECRET);
const senderPublic = mainKeypair.publicKey();

const channels = CHANNEL_SECRETS.map(s => ({
  kp: StellarSdk.Keypair.fromSecret(s),
  localSeq: null,
  loading: false,
}));

/** ---------- UTILITIES ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, { tries = RETRY_ATTEMPTS, base = RETRY_BASE_DELAY } = {}) {
  for (let a = 1; a <= tries; a++) {
    try { return await fn(); }
    catch (e) {
      const status = e.response?.status;
      if (![429,502,503,504].includes(status) || a === tries) throw e;
      const wait = base * 2 ** (a - 1);
      console.warn(`⌛ transient ${status} → retry ${a}/${tries} in ${wait}ms`);
      await sleep(wait);
    }
  }
}

const STROOPS_PER_UNIT = 10_000_000n;
const toStroops = (amountStr) => {
  const [i, fRaw = ''] = String(amountStr).split('.');
  const f = (fRaw + '0000000').slice(0, 7);
  return BigInt(i || '0') * STROOPS_PER_UNIT + BigInt(f || '0');
};
const fromStroops = (stroops) => {
  const i = stroops / STROOPS_PER_UNIT;
  const f = stroops % STROOPS_PER_UNIT;
  const fStr = f.toString().padStart(7, '0').replace(/0+$/, '');
  return i.toString() + (fStr ? '.' + fStr : '');
};

/** ---------- CHANNEL SEQUENCE CONTROL ---------- */
async function ensureChannelSeq(ch) {
  if (ch.localSeq != null) return;
  if (ch.loading) { while (ch.loading) await sleep(50); return; }
  ch.loading = true;
  try {
    const acc = await withRetry(() => server.loadAccount(ch.kp.publicKey()));
    ch.localSeq = BigInt(acc.sequence) + 1n;
    console.log(`🔢 Channel ${ch.kp.publicKey().slice(0,6)}… seq=${ch.localSeq}`);
  } catch (e) {
    ch.localSeq = null;
    throw new Error(`Channel load failed: ${e.message}`);
  } finally { ch.loading = false; }
}

function incrChannelSeq(ch) {
  if (ch.localSeq != null) ch.localSeq += 1n;
}

/** ---------- SMART CHANNEL PICKER (Fallback Chain) ---------- */
async function getAvailableChannel() {
  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    try {
      await ensureChannelSeq(ch);
      if (ch.localSeq) {
        console.log(`✅ Using Channel-${i+1}`);
        return ch;
      }
    } catch (err) {
      console.warn(`⚠️ Channel-${i+1} failed: ${err.message}`);
      ch.localSeq = null;
    }
  }
  console.error("🚫 All channels failed → fallback to main account");
  return null;
}

/** ---------- CLAIM + PAYMENT BATCH ---------- */
async function claimAndSweepBatch(claimables) {
  if (!claimables.length) {
    console.log('ℹ️ No available claimable balances found.');
    return;
  }

  let txChannel = await getAvailableChannel();
  const sourceKp = txChannel ? txChannel.kp : mainKeypair;
  const sourcePub = sourceKp.publicKey();

  let account;
  try {
    if (txChannel) {
      await ensureChannelSeq(txChannel);
      const seqToUse = txChannel.localSeq - 1n;
      account = new StellarSdk.Account(sourcePub, seqToUse.toString());
    } else {
      account = await withRetry(() => server.loadAccount(sourcePub));
    }
  } catch (e) {
    console.error('❌ Failed to load account for TX:', e.message);
    return;
  }

  const baseFee = await withRetry(() => server.fetchBaseFee());
  const opCount = BigInt(claimables.length * 2);
  const totalFee = (BigInt(baseFee) * opCount * 2n).toString();

  const tb = new StellarSdk.TransactionBuilder(account, {
    fee: totalFee,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  for (const cb of claimables) {
    const claimStroops = toStroops(cb.amount);
    const sweepStroops = claimStroops - BUFFER_STROOPS;
    if (sweepStroops <= 0n) continue;

    const sweepAmount = fromStroops(sweepStroops);

    tb.addOperation(StellarSdk.Operation.claimClaimableBalance({
      balanceId: cb.id,
      source: senderPublic,
    }));

    tb.addOperation(StellarSdk.Operation.payment({
      destination: RECIPIENT,
      asset: StellarSdk.Asset.native(),
      amount: sweepAmount,
      source: senderPublic,
    }));
    
  }

  const tx = tb.addMemo(StellarSdk.Memo.text('batch-claim+sweep'))
               .setTimeout(90)
               .build();

  tx.sign(sourceKp);
  if (sourceKp.publicKey() !== mainKeypair.publicKey()) tx.sign(mainKeypair);

  console.log(`📤 Submitting ${claimables.length * 2} operations via ${sourcePub.slice(0,6)}…`);

try {
  const res = await server.submitTransaction(tx);
  console.log(`✅ SUCCESS → TX Hash: ${res.hash}`);
  console.log("🔍 Full Success Response:", JSON.stringify(res, null, 2));

  if (txChannel) incrChannelSeq(txChannel);
  if(res.status !== 200){
    txChannel.localSeq = null;
      await ensureChannelSeq(txChannel);
    console.log("🔁 Status not 200 → calling main() again");
    await main(); // আবার TX চেষ্টা
  }

  // যদি status কোনো reason না থাকে (success), stop
  return true;

} catch(e) {
  const status = e.response?.status;
  const txCode = e.response?.data?.extras?.result_codes?.transaction;

  console.error(`❌ TX failed [${txCode || e.message}], status=${status}`);
   await main(); // আবার TX চেষ্টা

  if (txChannel) {
    // bad sequence হলে sequence reset + reload
    if (txCode === "tx_bad_seq") {
      console.log("⚡ Bad sequence → reload sequence");
      txChannel.localSeq = null;
      await ensureChannelSeq(txChannel);
    } else {
      // অন্য কোনো error → sequence reset
      txChannel.localSeq = null;
    }
  }

  // যদি status 400 বা অন্য fail আসে → main() পুনরায় কল
  if (status === 400 || status >= 400) {
    console.log("🔁 Status failed → calling main() again");
    await main(); // আবার TX চেষ্টা
  }

  return false;
}

}

/** ---------- MAIN ---------- */
async function main() {
  console.log(`🚀 Starting for ${senderPublic}`);
  try {
    const page = await withRetry(() =>
      server.claimableBalances().claimant(senderPublic).limit(200).call()
    );
    const available = (page.records || []).filter(cb =>
      (cb.claimants || []).some(c => c.destination === senderPublic)
    );
    await claimAndSweepBatch(available);
  } catch (e) {
    console.error('❌ Load failed:', e.message);
    main();
    setInterval(() => {
      main();
    }, 1000);
  }
}



// // Desired target time (24-hour format)
 const targetTime = "21:49:08"; // HH:MM:SS format



// Helper function to calculate milliseconds until target time
function getMsUntilTarget() {
  const now = new Date();
  const [h, m, s] = targetTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, s, 0);
  let diff = target - now;
  if (diff < 0) diff += 24 * 3600 * 1000; // যদি সময় পার হয়ে যায়, পরের দিনের জন্য অপেক্ষা করবে
  return diff;
}

// Main logic
const ms = getMsUntilTarget();
const when = new Date(Date.now() + ms);
console.log(`🕒 claim() will run at ${when.toLocaleTimeString()}`);

setTimeout(() => {
 main();
}, ms);

// // Desired target time (24-hour format)
// const targetTime = "1:27:10"; // HH:MM:SS format

// // Helper: calculate ms until next target time
// function getMsUntilTarget() {
//   const now = new Date();
//   const [h, m, s] = targetTime.split(':').map(Number);

//   const target = new Date();
//   target.setHours(h, m, s, 0);

//   // যদি সময় পার হয়ে যায়, পরের দিনের জন্য সেট করবে
//   if (target <= now) {
//     target.setDate(target.getDate() + 1);
//   }

//   return target - now;
// }

// // দৈনিক scheduler চালু
// function scheduleDailyStart() {
//   const ms = getMsUntilTarget();
//   const next = new Date(Date.now() + ms);

//   console.log(`🕒 Next run scheduled at: ${next.toLocaleTimeString()}`);

//   setTimeout(() => {
//     console.log("🚀 Starting daily cycle…");
//     main();              // start running script
//     startLoopingMain();  // continuous loop
//     scheduleDailyStart(); // re-schedule for next day
//   }, ms);
// }

// // Continuous main() caller
// function startLoopingMain() {
//   setInterval(() => {
//     main();
//   }, 2000); // প্রতি 2 সেকেন্ডে main() চালাবে (আপনার ইচ্ছামতো)
// }

// // Start the scheduler
// scheduleDailyStart();



// Graceful shutdown
process.on('SIGINT',  () => { console.log('👋 exit'); process.exit(0); });
process.on('SIGTERM', () => { console.log('👋 exit'); process.exit(0); });







//  Starting for GA5OBIWROXPCECWTFAAAEGX5CLHJJX334IJOFUSFSC7ZTRHREFW4DX6I
// 🔢 Channel GABSJS… seq=37523896609538075
// ✅ Using Channel-1
// 📤 Submitting 2 operations via GABSJS…
// ✅ SUCCESS → TX Hash: 3f4332d7430e87ad5743af6f92efd1c32c5b87617386c737e75e1d90fc315544
// 🔍 Full Success Response: {
//   "memo": "batch-claim+sweep",
//   "memo_bytes": "YmF0Y2gtY2xhaW0rc3dlZXA=",
//   "_links": {
//     "self": {
//       "href": "https://api.mainnet.minepi.com/transactions/3f4332d7430e87ad5743af6f92efd1c32c5b87617386c737e75e1d90fc315544"
//     },
//     "account": {
//       "href": "https://api.mainnet.minepi.com/accounts/GABSJSDBXBZYO3EDZNCBEJMMALHAXPIH2HBW5CWV3UICQK3ITNBP2JVN"
//     },
//     "ledger": {
//       "href": "https://api.mainnet.minepi.com/ledgers/24013033"
//     },
//     "operations": {
//       "href": "https://api.mainnet.minepi.com/transactions/3f4332d7430e87ad5743af6f92efd1c32c5b87617386c737e75e1d90fc315544/operations{?cursor,limit,order}",
//       "templated": true
//     },
//     "effects": {
//       "href": "https://api.mainnet.minepi.com/transactions/3f4332d7430e87ad5743af6f92efd1c32c5b87617386c737e75e1d90fc315544/effects{?cursor,limit,order}",
//       "templated": true
//     },
//     "precedes": {
//       "href": "https://api.mainnet.minepi.com/transactions?order=asc&cursor=103135191412781056"
//     },
//     "succeeds": {
//       "href": "https://api.mainnet.minepi.com/transactions?order=desc&cursor=103135191412781056"
//     },
//     "transaction": {
//       "href": "https://api.mainnet.minepi.com/transactions/3f4332d7430e87ad5743af6f92efd1c32c5b87617386c737e75e1d90fc315544"
//     }
//   },
//   "id": "3f4332d7430e87ad5743af6f92efd1c32c5b87617386c737e75e1d90fc315544",
//   "paging_token": "103135191412781056",
//   "successful": true,
//   "hash": "3f4332d7430e87ad5743af6f92efd1c32c5b87617386c737e75e1d90fc315544",
//   "ledger": 24013033,
//   "created_at": "2025-12-03T05:40:07Z",
//   "source_account": "GABSJSDBXBZYO3EDZNCBEJMMALHAXPIH2HBW5CWV3UICQK3ITNBP2JVN",
//   "source_account_sequence": "37523896609538075",
//   "fee_account": "GABSJSDBXBZYO3EDZNCBEJMMALHAXPIH2HBW5CWV3UICQK3ITNBP2JVN",
//   "fee_charged": "200000",
//   "max_fee": "800000",
//   "operation_count": 2,
//   "envelope_xdr": "AAAAAgAAAAADJMhhuHOHbIPLRBIljALOC70H0cNuitXdECgraJtC/QAMNQAAhU/JAAAAGwAAAAEAAAAAAAAAAAAAAABpL82MAAAAAQAAABFiYXRjaC1jbGFpbStzd2VlcAAAAAAAAAIAAAABAAAAADrgotF13iIK0ygAAhr9Es6U33viEuLSRZC/mcTxIW3BAAAADwAAAAAd/6KBtV9UX7hoMjfSvKuvoaL3m27UJ1NnDVtA3BjSyAAAAAEAAAAAOuCi0XXeIgrTKAACGv0SzpTfe+IS4tJFkL+ZxPEhbcEAAAABAAAAAGBgwlCLovCMX8CevyVACJlc9dcv0GIie+V5ZJ+6QF+pAAAAAAAAAAAWlanlAAAAAAAAAAJom0L9AAAAQAZ+tnKHZwAr/hyik1DhIWJ22PbJq2LJl6+nUsPf0griNjHSUtp1S7dPNLQpnvGj/WzVhnDyIK71ew9WeH5EdwTxIW3BAAAAQHWy+cO+/Qw2yradgr0zV1pYy0/tXRTCC+kvKpjuK0X4UihuWUMqGwXAfk4LFUOUUkUQq3h91xposMVXuhMUKAI=",
//   "result_xdr": "AAAAAAADDUAAAAAAAAAAAgAAAAAAAAAPAAAAAAAAAAAAAAABAAAAAAAAAAA=",
//   "result_meta_xdr": "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",
//   "fee_meta_xdr": "AAAAAgAAAAMBbk6CAAAAAAAAAAADJMhhuHOHbIPLRBIljALOC70H0cNuitXdECgraJtC/QAAAAAA2U6FAIVPyQAAABoAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAAFuToIAAAAAaS9B/QAAAAAAAAABAW5o6QAAAAAAAAAAAyTIYbhzh2yDy0QSJYwCzgu9B9HDborV3RAoK2ibQv0AAAAAANZBRQCFT8kAAAAaAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAABbk6CAAAAAGkvQf0AAAAA",
//   "memo_type": "text",
//   "signatures": [
//     "Bn62codnACv+HKKTUOEhYnbY9smrYsmXr6dSw9/SCuI2MdJS2nVLt080tCme8aP9bNWGcPIgrvV7D1Z4fkR3BA==",
//     "dbL5w779DDbKtp2CvTNXWljLT+1dFMIL6S8qmO4rRfhSKG5ZQyobBcB+TgsVQ5RSRRCreH3XGmiwxVe6ExQoAg=="
//   ],
//   "valid_after": "1970-01-01T00:00:00Z",
//   "valid_before": "2025-12-03T05:41:32Z",
//   "preconditions": {
//     "timebounds": {
//       "min_time": "0",
//       "max_time": "1764740492"
//     }
//   }
// }
// 🔢 Channel GABSJS… seq=37523896609538076
// 🔁 Status not 200 → calling main() again
// 🚀 Starting for GA5OBIWROXPCECWTFAAAEGX5CLHJJX334IJOFUSFSC7ZTRHREFW4DX6I
// ℹ️ No available claimable balances found.