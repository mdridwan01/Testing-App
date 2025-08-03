const StellarSdk = require('stellar-sdk');

const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
const senderSecret = 'SAYTGOPIMJSPEF4MKLMMPA76NILEEQWLVWOJDAMG3UWH6B63F2DMTTKU'; // তোমার secret
const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
const senderPublic = senderKeypair.publicKey();

const recipientAddress = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';


// na pawar 2 ta karon 
// 1. operation er somoy 0.40 sen silo na tai kaj kore nai onno bot kheye felse 0.80 sen. == sulation fee komate hobe.
// 2. correct time e run korte hobe.
// 3. server first lagbe.


async function sendAlternatingOperations(po) {
  console.log(po);
  try {
    // claimableBalances নিয়ে আসা
    const balancesResponse = await server.claimableBalances().claimant(senderPublic).call();
    const claimables = balancesResponse.records;
    // if (balances.records.length === 0) {
    //             console.log(`⏳ No claimable balances. Waiting 1s...`);
    //             return
    //         }

    // if (claimables.length === 0) {
    //   console.log('কোনো claimable balance নেই');
    //   return;
    // }

    // Load account for transaction building
    const account = await server.loadAccount(senderPublic);
    const baseFee = await server.fetchBaseFee();

  

    const maxOperations = 2;
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: baseFee ,
      networkPassphrase: 'Pi Network',
    });

    let claimIndex = 0;
    let paymentCount = 0;

    for (let i = 0; i < maxOperations; i++) {
      if (i % 2 === 0 && claimIndex < 40) {
        // even index: claim operation
        txBuilder.addOperation(StellarSdk.Operation.claimClaimableBalance({
          balanceId: claimables[0].id,
        }));
         console.log(`✅ Claim added: ${claimables[0].id}`);
        claimIndex++;
      } else {
        // odd index বা claimable শেষ হলে payment
        txBuilder.addOperation(StellarSdk.Operation.payment({
          destination: recipientAddress,
          asset: StellarSdk.Asset.native(),
          amount: '90',
        }));
        paymentCount++;
        console.log(`💸 Payment operation added: ${recipientAddress}`);
      }
    }

    const tx = txBuilder.setTimeout(30).build();
    tx.sign(senderKeypair);

    const result = await server.submitTransaction(tx);
    console.log(`✅ Transaction সফল! Hash: ${result.hash}`);
    console.log(`📦 Claim operations: ${claimIndex}, 💸 Payment operations: ${paymentCount}`);
  } catch (err) {
    console.error('Error:', err.response?.data?.extras?.result_codes || err.message || err);
  }
}


setInterval(() => {
    sendAlternatingOperations("⏳Sending alternating claim + transfer...");
}, 3000);

