// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SD36W5FSBJ2VBRNKEBMWZH3LJSLCYXHKKRDSLXYCI44DIJUSNWPQHNLT'; // Replace with your real secret (use .env in production)
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';

// async function sendBatchTransactions() {
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const baseSeq = BigInt(account.sequence);
//         const fee = await server.fetchBaseFee();

//         console.log(`Base Sequence: ${baseSeq.toString()}`);
//         console.log(`Sending 10 transactions from ${senderPublic}`);

//         const transactions = [];

//         for (let i = 1; i <= 10; i++) {
//             const newAccount = new StellarSdk.Account(senderPublic, (baseSeq + BigInt(i)).toString());

//             const tx = new StellarSdk.TransactionBuilder(newAccount, {
//                 fee: fee.toString(),
//                 networkPassphrase: 'Pi Network',
//             })
//                 .addOperation(StellarSdk.Operation.payment({
//                     destination: recipient,
//                     asset: StellarSdk.Asset.native(),
//                     amount: "0.001", // send 1 Pi
//                 }))
//                 .setTimeout(30)
//                 .build();

//             tx.sign(senderKeypair);
//             transactions.push(tx);
//         }

//         // Submit all 10 transactions in parallel
//         const submitPromises = transactions.map((tx, index) =>
//             server.submitTransaction(tx)
//                 .then(res => console.log(`✅ Tx ${index + 1} success: ${res.hash}`))
//                 .catch(err => console.error(`❌ Tx ${index + 1} failed:`, err.response?.data?.extras?.result_codes || err.message))
//         );

//         await Promise.all(submitPromises);
//     } catch (err) {
//         console.error("Fatal Error:", err.message || err);
//     }
// }

// // Send 10 transactions every 5 seconds
// setInterval(() => {
//     sendBatchTransactions();
// }, 5000);


const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

// ✅ নিজের Sender Secret দিয়ে বদলান (সাবধান!)
const senderSecret = 'SD36W5FSBJ2VBRNKEBMWZH3LJSLCYXHKKRDSLXYCI44DIJUSNWPQHNLT'; 
const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
const senderPublic = senderKeypair.publicKey();

// ✅ Receiver Account
const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';

// Helper: Delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendBatchTransactions() {
    try {
        const account = await server.loadAccount(senderPublic);
        const baseSeq = BigInt(account.sequence);
        const fee = await server.fetchBaseFee();

        console.log(`Sender: ${senderPublic}`);
        console.log(`Sequence: ${baseSeq}`);
        console.log(`Starting 10 transactions...`);

        for (let i = 1; i <= 10; i++) {
            const txAccount = new StellarSdk.Account(senderPublic, (baseSeq + BigInt(i)).toString());

            const tx = new StellarSdk.TransactionBuilder(txAccount, {
                fee: fee.toString(),
                networkPassphrase: 'Pi Network', // ✅ Confirm this string is correct for your Pi setup
            })
                .addOperation(StellarSdk.Operation.payment({
                    destination: recipient,
                    asset: StellarSdk.Asset.native(),
                    amount: "0.001", // Small amount for test
                }))
                .setTimeout(30)
                .build();

            tx.sign(senderKeypair);

            try {
                const res = await server.submitTransaction(tx);
                console.log(`✅ Tx ${i} SUCCESS - Hash: ${res.hash}`);
            } catch (err) {
                const msg = err?.response?.data?.extras?.result_codes || err.message || 'Unknown error';
                console.error(`❌ Tx ${i} FAILED -`, msg);
            }

            await sleep(300); // Delay between transactions to avoid rate-limiting
        }

    } catch (err) {
        console.error("🔥 Fatal error:", err.message || err);
    }
}

sendBatchTransactions();
