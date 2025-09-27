// npm i stellar-sdk dotenv
require('dotenv').config();
const StellarSdk = require('stellar-sdk');

/** ---------- Config ---------- */
const HORIZON_URL        = process.env.HORIZON_URL || 'https://api.mainnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Pi Network';
const SENDER_SECRET      = process.env.SENDER_SECRET;
const RECIPIENT          = process.env.RECIPIENT;
const BUFFER_STROOPS     = BigInt(process.env.BUFFER_STROOPS || 10000n); // ~0.001 native

// Channel accounts (comma-separated secret seeds)
const CHANNEL_SECRETS = (process.env.CHANNEL_SECRETS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Concurrency (how many claims in-flight)
const DEFAULT_CONC = CHANNEL_SECRETS.length > 0 ? Math.min(3, CHANNEL_SECRETS.length) : 1;
const QUEUE_CONCURRENCY = Number(process.env.QUEUE_CONCURRENCY || DEFAULT_CONC);

if (!SENDER_SECRET || !RECIPIENT) {
  console.error('❌ .env এ SENDER_SECRET এবং RECIPIENT লাগবে।'); process.exit(1);
}
if (!StellarSdk.StrKey.isValidEd25519SecretSeed(SENDER_SECRET)) {
  console.error('❌ SENDER_SECRET invalid।'); process.exit(1);
}
if (!StellarSdk.StrKey.isValidEd25519PublicKey(RECIPIENT)) {
  console.error('❌ RECIPIENT invalid।'); process.exit(1);
}
CHANNEL_SECRETS.forEach((sec, i) => {
  if (!StellarSdk.StrKey.isValidEd25519SecretSeed(sec)) {
    console.error(`❌ CHANNEL_SECRETS[${i}] invalid secret`); process.exit(1);
  }
});

const server       = new StellarSdk.Server(HORIZON_URL);
const mainKeypair  = StellarSdk.Keypair.fromSecret(SENDER_SECRET);
const senderPublic = mainKeypair.publicKey();

// channels: each entry has kp, localSeq (BigInt or null), loading flag
const channels = CHANNEL_SECRETS.map(s => ({
  kp: StellarSdk.Keypair.fromSecret(s),
  localSeq: null,    // BigInt next sequence to use
  loading: false,    // prevent concurrent loads
}));

let rr = 0; // round-robin index

/** ---------- Amount helpers (stroops BigInt) ---------- */
const STROOPS_PER_UNIT = 10_000_000n;
function toStroops(amountStr) {
  const [i, fRaw = ''] = String(amountStr).split('.');
  const f = (fRaw + '0000000').slice(0, 7);
  return BigInt(i || '0') * STROOPS_PER_UNIT + BigInt(f || '0');
}
function fromStroops(stroops) {
  const sign = stroops < 0 ? '-' : '';
  let s = stroops < 0 ? -stroops : stroops;
  const i = s / STROOPS_PER_UNIT;
  const f = s % STROOPS_PER_UNIT;
  const fStr = f.toString().padStart(7, '0').replace(/0+$/, '');
  return sign + i.toString() + (fStr ? '.' + fStr : '');
}

/** ---------- Retry helper (HTTP 429/5xx) ---------- */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function withRetry(fn, { tries = 5, base = 500 } = {}) {
  for (let a = 1; a <= tries; a++) {
    try { return await fn(); }
    catch (e) {
      const status = e.response?.status;
      if (![429,502,503,504].includes(status) || a === tries) throw e;
      const wait = base * 2 ** (a - 1);
      console.warn(`⌛ transient ${status} → retry in ${wait}ms`);
      await sleep(wait);
    }
  }
}

/** ---------- Time window + formatting ---------- */
const DHAKA_TZ = 'Asia/Dhaka';
function fmt(tsSec) {
  if (!Number.isFinite(tsSec)) return '∞';
  const d = new Date(tsSec * 1000);
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: DHAKA_TZ, dateStyle: 'medium', timeStyle: 'medium'
  }).format(d);
  return `${local} (Dhaka)`;
}
function humanDelta(fromSec, toSec) {
  const s = Math.max(0, Math.floor(toSec - fromSec));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
        m = Math.floor((s % 3600) / 60), sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`); if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`); if (sec && !parts.length) parts.push(`${sec}s`);
  return parts.join(' ');
}

/* Interval helpers omitted here for brevity (use your original functions) */
const NEG=-Infinity, POS=+Infinity;
function unionIntervals(xs){ if(!xs.length) return []; xs.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const out=[xs[0].slice()]; for(let i=1;i<xs.length;i++){ const [s,e]=xs[i], last=out[out.length-1];
  if(s<=last[1]) last[1]=Math.max(last[1],e); else out.push([s,e]); } return out; }
function intersectIntervals(A,B){ const out=[]; let i=0,j=0; while(i<A.length&&j<B.length){
  const [a1,a2]=A[i],[b1,b2]=B[j]; const s=Math.max(a1,b1), e=Math.min(a2,b2);
  if(s<e) out.push([s,e]); if(a2<b2) i++; else j++; } return out; }
function complementIntervals(U){ const u=unionIntervals(U), out=[]; let cur=NEG;
  for(const [s,e] of u){ if(cur<s) out.push([cur,s]); cur=e; } if(cur<POS) out.push([cur,POS]); return out; }
function parseEpoch(v){ if(v==null) return null; if(/^\d+$/.test(String(v))) return Number(v);
  return Math.floor(new Date(v).getTime()/1000); }
function predicateToIntervals(pred, createdSec){
  if(!pred) return [];
  if(pred.unconditional===true) return [[NEG,POS]];
  const abs = parseEpoch(pred.abs_before_epoch || pred.abs_before);
  if(abs!=null) return [[NEG,abs]];
  const rel = Number(pred.rel_before_seconds || pred.rel_before);
  if(!Number.isNaN(rel) && rel!=null) return [[NEG, createdSec + rel]];
  if(pred.not){ return complementIntervals(predicateToIntervals(pred.not, createdSec)); }
  if(Array.isArray(pred.and)){
    return pred.and.reduce((acc,p)=>intersectIntervals(acc, predicateToIntervals(p,createdSec)), [[NEG,POS]]);
  }
  if(Array.isArray(pred.or)){
    return unionIntervals(pred.or.flatMap(p=>predicateToIntervals(p,createdSec)));
  }
  return [];
}
function windowInfoForClaimant(claimant, lastModifiedTimeSec){
  const now = Math.floor(Date.now()/1000);
  const created = lastModifiedTimeSec;
  const intervals = unionIntervals(predicateToIntervals(claimant.predicate, created));
  if(!intervals.length) return {status:'never', intervals};
  for(const [s,e] of intervals){ if(s<=now && now<e) return {status:'available', start:s, end:e, intervals}; }
  const future = intervals.find(([s])=>s>now);
  if(future) return {status:'pending', start:future[0], end:future[1], intervals};
  const lastPast = intervals[intervals.length-1];
  return {status:'expired', start:lastPast[0], end:lastPast[1], intervals};
}

/** ---------- Scheduler + Queue (with concurrency) ---------- */
const timers = new Map();    // balanceId -> timeout handle
const claimLock = new Set(); // balanceIds currently being processed
const queue = [];
let activeWorkers = 0;

function scheduleAt(balanceId, whenSec, cbObj) {
  const old = timers.get(balanceId);
  if (old) clearTimeout(old);

  const nowSec = Math.floor(Date.now()/1000);
  const delayMs = Math.max(0, (whenSec - nowSec) * 1000);
  const handle = setTimeout(() => {
    timers.delete(balanceId);
    enqueue(cbObj);
  }, delayMs);
  timers.set(balanceId, handle);

  console.log(`⏳ scheduled id=${balanceId} at ${fmt(whenSec)} (≈ ${humanDelta(nowSec, whenSec)})`);
}
function cancelSchedule(balanceId) {
  const t = timers.get(balanceId);
  if (t) clearTimeout(t);
  timers.delete(balanceId);
}
function enqueue(cbObj) {
  if (claimLock.has(cbObj.id)) return;
  queue.push(cbObj);
  pump();
}
function pump() {
  while (activeWorkers < QUEUE_CONCURRENCY && queue.length) {
    const cb = queue.shift();
    if (claimLock.has(cb.id)) continue;
    activeWorkers++;
    claimLock.add(cb.id);
    handleOne(cb).finally(() => {
      claimLock.delete(cb.id);
      activeWorkers--;
      setImmediate(pump);
    });
  }
}

/** ---------- Channel sequence helpers ---------- */
// Ensure channel has a cached next sequence (BigInt)
async function ensureChannelSeq(ch) {
  if (ch.localSeq != null) return;
  if (ch.loading) {
    // wait until other caller finishes loading
    while (ch.loading) await sleep(50);
    return;
  }
  ch.loading = true;
  try {
    const acc = await withRetry(() => server.loadAccount(ch.kp.publicKey()));
    // acc.sequence is string, nextSeq = BigInt(acc.sequence) + 1n
    ch.localSeq = BigInt(acc.sequence) + 1n;
    console.log(`🔢 channel ${ch.kp.publicKey().slice(0,6)}… seq=${ch.localSeq}`);
  } catch (e) {
    console.warn('⚠ failed to load channel account for sequence:', e && e.message ? e.message : e);
    ch.localSeq = null;
    throw e;
  } finally {
    ch.loading = false;
  }
}

// increment localSeq after we commit to using it (call after successful submit)
// We will increment after submit; on tx_bad_seq we reset to null so next attempt reloads.
function incrChannelSeq(ch) {
  if (ch.localSeq != null) ch.localSeq = ch.localSeq + 1n;
}

/** ---------- Pick channel (or fallback to main) ---------- */
function pickChannel() {
  if (!channels.length) return null;
  const ch = channels[rr % channels.length];
  rr++;
  return ch;
}

/** ---------- Core: claim + sweep (with smart retry + channel seq) ---------- */
async function handleOne(cb) {
  try {
    await claimAndSweep(cb);
  } catch (e) {
    const rc = e.response?.data?.extras?.result_codes;
    console.error(`❌ claim ${cb.id} error:`, rc || e.message || e);
  }
}

async function claimAndSweep(cb) {
  if (cb.asset !== 'native') {
    console.warn(`⚠️ skip non-native: ${cb.asset}, id=${cb.id}`);
    return;
  }

  // Final window check
  const createdSec = Math.floor(new Date(cb.last_modified_time).getTime()/1000);
  const me = (cb.claimants || []).find(c => c.destination === senderPublic);
  if (!me) return;
  let info = windowInfoForClaimant(me, createdSec);
  if (info.status === 'pending') {
    scheduleAt(cb.id, info.start, cb);
    return;
  }
  if (info.status !== 'available') return;

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;

    // choose TX source (channel or main)
    let txChannel = pickChannel();
    let sourceKp = txChannel ? txChannel.kp : mainKeypair;
    const sourcePub = sourceKp.publicKey();

    // If using a channel, ensure we have local sequence cached
    let account;
    try {
      if (txChannel) {
        await ensureChannelSeq(txChannel);
        // build an Account object with sequence = localSeq - 1 (TransactionBuilder will increment)
        const seqToUse = txChannel.localSeq - 1n;
        account = new StellarSdk.Account(sourcePub, seqToUse.toString());
      } else {
        account = await withRetry(() => server.loadAccount(sourcePub));
      }
    } catch (e) {
      console.warn('⚠️ failed loading account (will retry outer loop):', e && e.message ? e.message : e);
      // on error loading channel account, clear localSeq to force reload next attempt
      if (txChannel) txChannel.localSeq = null;
      if (attempt < maxAttempts) { await sleep(200 * attempt); continue; }
      throw e;
    }

    // fetch base fee
    const baseFee  = await withRetry(() => server.fetchBaseFee());
    const perOpFee = BigInt(baseFee) * 2n; // priority
    const opCount  = 2n;                   // claim + payment
    const totalFee = perOpFee * opCount;

    const claimStroops = toStroops(cb.amount);
    let sweepStroops = claimStroops - totalFee - BUFFER_STROOPS;
    if (sweepStroops <= 0n) {
      console.warn(`⚠️ too small after fees/buffer id=${cb.id}`);
      return;
    }
    const sweepAmount = fromStroops(sweepStroops);

    // Build TX using the account (which may be a local Account with cached seq)
    const tb = new StellarSdk.TransactionBuilder(account, {
      fee: perOpFee.toString(),
      networkPassphrase: NETWORK_PASSPHRASE,
    });

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
    const tx = tb.addMemo(StellarSdk.Memo.text('claim+sweep')).setTimeout(60).build();

    // Sign: signer must include tx source + main (op sources). If channel != main, sign with channel and main
    tx.sign(sourceKp);
    if (sourceKp.publicKey() !== mainKeypair.publicKey()) {
      tx.sign(mainKeypair);
    }

    // Submit
    try {
      console.log(`📤 submit (try ${attempt}) id=${cb.id} via=${sourcePub.slice(0,6)}… claimed=${cb.amount} sweep=${sweepAmount} | expires: ${Number.isFinite(info.end)?fmt(info.end):'∞'}`);
      const res = await server.submitTransaction(tx);
      console.log('✅ success hash:', res.hash);

      // on success: if used channel, increment localSeq (we consumed it)
      if (txChannel) incrChannelSeq(txChannel);
      return;
    } catch (e) {
      const txCode  = e.response?.data?.extras?.result_codes?.transaction;
      const opCodes = e.response?.data?.extras?.result_codes?.operations || [];
      console.error('❌ submit error:', txCode, opCodes);

      // Sequence issue → reset channel seq so it will reload next loop and retry
      if (txCode === 'tx_bad_seq') {
        console.warn('↻ tx_bad_seq ⇒ reset channel sequence & retry (maybe different channel)');
        if (txChannel) txChannel.localSeq = null;
        continue;
      }

      // Fee/underfunded → recompute on next loop with refreshed baseFee
      if (txCode === 'tx_insufficient_fee' || opCodes.includes('op_underfunded')) {
        console.warn('↻ fee/underfunded ⇒ refetch baseFee & recompute sweep then retry');
        continue;
      }

      // Too early / predicate mismatch → reschedule precisely
      if (txCode === 'tx_too_early' || opCodes.some(c => /not_authorized|claimant_invalid|predicate/i.test(c))) {
        const nowSec = Math.floor(Date.now()/1000);
        info = windowInfoForClaimant(me, createdSec); // recompute
        const nextAt = info?.start && info.start > nowSec ? info.start : nowSec + 2;
        console.warn(`⏳ reschedule id=${cb.id} at ${fmt(nextAt)}`);
        scheduleAt(cb.id, nextAt, cb);
        return;
      }

      // Network 429/5xx? retry small number
      const status = e.response?.status;
      if ([429,502,503,504].includes(status) && attempt < maxAttempts) {
        const wait = 1000 * attempt;
        console.warn(`⌛ transient ${status} ⇒ wait ${wait}ms & retry`);
        await sleep(wait);
        continue;
      }

      console.error('⛔ non-retryable error, giving up.');
      return;
    }
  }
}

/** ---------- Intake: initial scan + open stream ---------- */
async function seedAndStream() {
  console.log(`🚀 start for ${senderPublic} | channels=${channels.length} | concurrency=${QUEUE_CONCURRENCY}`);

  // 1) Initial scan (schedule/enqueue current CBs)
  try {
    const page = await withRetry(() =>
      server.claimableBalances().claimant(senderPublic).limit(200).call()
    );
    for (const cb of (page.records || [])) handleCB(cb, {onStartup:true});
  } catch (e) {
    console.error('❌ initial load failed:', e.message || e);
  }

  // 2) Open live stream from "now"
  let backoff = 1000, es;
  const reopen = async () => {
    try { es && es.close && es.close(); } catch {}
    console.log('🔊 opening claimableBalances stream (cursor=now)…');
    es = server.claimableBalances()
      .claimant(senderPublic)
      .cursor('now')
      .stream({
        onmessage: cb => { handleCB(cb, {onStartup:false}); },
        onerror: async err => {
          console.error('⚠️ stream error:', err && err.message ? err.message : err);
          await sleep(backoff);
          backoff = Math.min(backoff * 2, 30000);
          reopen();
        }
      });
  };
  reopen();
}

function handleCB(cb, {onStartup}) {
  const me = (cb.claimants || []).find(c => c.destination === senderPublic);
  if (!me) return;

  if (cb.asset !== 'native') {
    console.warn(`⚠️ skip non-native: ${cb.asset}, id=${cb.id}`);
    cancelSchedule(cb.id);
    return;
  }

  const createdSec = Math.floor(new Date(cb.last_modified_time).getTime()/1000);
  const info = windowInfoForClaimant(me, createdSec);
  const nowSec = Math.floor(Date.now()/1000);

  if (info.status === 'available') {
    console.log(`🟢 AVAILABLE — id=${cb.id} amount=${cb.amount} | expires: ${Number.isFinite(info.end)?fmt(info.end):'∞'}`);
    enqueue(cb);
  } else if (info.status === 'pending') {
    console.log(`🟡 WILL UNLOCK at ${fmt(info.start)} (≈ ${humanDelta(nowSec, info.start)}) | id=${cb.id}`);
    scheduleAt(cb.id, info.start, cb);
  } else if (info.status === 'expired') {
    console.log(`🔴 EXPIRED at ${fmt(info.end)} | id=${cb.id}`);
    cancelSchedule(cb.id);
  } else {
    console.log(`⚪ NEVER claimable by current predicate | id=${cb.id}`);
    cancelSchedule(cb.id);
  }
}

/** ---------- Kickoff ---------- */
seedAndStream();

// Graceful shutdown
process.on('SIGINT',  () => { console.log('👋 exit'); process.exit(0); });
process.on('SIGTERM', () => { console.log('👋 exit'); process.exit(0); });
