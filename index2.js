// const {
//   Server,
//   Keypair,
//   TransactionBuilder,
//   Operation,
//   Asset,
// } = require("stellar-sdk");
// const axios = require("axios");

// const server = new Server("https://api.mainnet.minepi.com");

// const senderSecret = "SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD";
// const senderKeypair = Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const recipient = "GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS";
// const NETWORK_PASSPHRASE = "Pi Network";

// async function sendMultipleTransactions(count = 20) {
//   try {
//     const account = await server.loadAccount(senderPublic);
//     const baseFee = await server.fetchBaseFee();

//     let currentSequence = account.sequence;
//     console.log(`Starting sequence: ${currentSequence}`);

//     for (let i = 0; i < count; i++) {
//       const txBuilder = new TransactionBuilder(account, {
//         fee: baseFee.toString(),
//         networkPassphrase: NETWORK_PASSPHRASE,
//       });

//       txBuilder.addOperation(
//         Operation.payment({
//           destination: recipient,
//           asset: Asset.native(),
//           amount: "1", // ✅ প্রতি ট্রানজেকশনে যত Pi পাঠাতে চান
//         })
//       );

//       // নতুন সিকোয়েন্স নাম্বার সেট করুন
//       const sequence = BigInt(currentSequence) + BigInt(i + 1);
//       txBuilder.setTimeout(30);
//       const tx = txBuilder.setSequenceNumber(sequence.toString()).build();

//       tx.sign(senderKeypair);

//       // সাবমিট করুন
//       try {
//         const result = await server.submitTransaction(tx);
//         console.log(`✅ Tx #${i + 1}: ${result.hash}`);
//       } catch (err) {
//         console.error(`
//           ❌ Tx #${i + 1} failed:,
//           err.response?.data?.extras?.result_codes || err
//         `);
//       }
//     }
//   } catch (e) {
//     console.error("❌ Error:", e);
//   }
// }

// setInterval(() => {
//   sendMultipleTransactions(20);
// }, 1000);


// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD';
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const recipient = 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS';
// const networkPassphrase = 'Pi Network';

// async function sendPiWithSequence(sequence, fee, index) {
//      const withdrawAmount = Number("1");
//     try {
//         const tx = new StellarSdk.TransactionBuilder(
//             new StellarSdk.Account(senderPublic, sequence),
//             {
//                 fee,
//                 networkPassphrase,
//             }
//         )
//             .addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: withdrawAmount.toString(), // change amount as needed
//             }))
//             .setTimeout(30)
//             .build();

//         tx.sign(senderKeypair);
//         const result = await server.submitTransaction(tx);
//         console.log(`✅ Tx ${index + 1} success: ${result.hash}`);
//     } catch (e) {
//         console.error(`❌ Tx ${index + 1} failed:`, e.response?.data?.extras?.result_codes || e);
//     }
// }

// async function sendMultipleTransactions(count) {
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const fee = await server.fetchBaseFee();
//         let baseSequence = BigInt(account.sequence); // use BigInt to avoid precision issue

//         for (let i = 0; i < count; i++) {
//             const sequence = (baseSequence + BigInt(i + 1)).toString();
//             setTimeout(() => {
//                 sendPiWithSequence(sequence, fee, i);
//             }, i * 50); // 50ms delay between each tx
//         }
//     } catch (e) {
//         console.error('❌ Error loading account or fee:', e.message);
//     }
// }

// // প্রতি সেকেন্ডে ২০টি ট্রানজ্যাকশন পাঠাও
// setInterval(() => {
//     sendMultipleTransactions(20);
// }, 1000);


// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD'; // ⚠️ Real secret, protect this
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const recipient = 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS';
// const networkPassphrase = 'Pi Network';

// // ========== TRANSACTION FUNCTION ==========
// async function sendPiWithSequence(sequence, fee, index, retryCount = 0) {
//     try {
//         const account = new StellarSdk.Account(senderPublic, sequence);
//         const tx = new StellarSdk.TransactionBuilder(account, {
//             fee,
//             networkPassphrase,
//         })
//             .addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: "5", // Smallest safe value
//             }))
//             .setTimeout(30)
//             .build();

//         tx.sign(senderKeypair);
//         const result = await server.submitTransaction(tx);
//         console.log(`✅ Tx ${index + 1} Success: ${result.hash}`);
//     } catch (e) {
//         if (e.response?.status === 429 && retryCount < 5) {
//             const delay = 1000 * (retryCount + 1); // Exponential backoff
//             console.warn(`⏳ Tx ${index + 1} rate-limited. Retrying in ${delay}ms...`);
//             setTimeout(() => {
//                 sendPiWithSequence(sequence, fee, index, retryCount + 1);
//             }, delay);
//         } else {
//             console.error(`❌ Tx ${index + 1} failed:`, {
//                 reason: e.response?.data?.extras?.result_codes || e.message
//             });
//         }
//     }
// }

// // ========== BATCH FUNCTION ==========
// async function sendMultipleTransactions(countPerSecond) {
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const fee = await server.fetchBaseFee();
//         let baseSequence = BigInt(account.sequence);

//         for (let i = 0; i < countPerSecond; i++) {
//             const sequence = (baseSequence + BigInt(i + 1)).toString();

//             setTimeout(() => {
//                 sendPiWithSequence(sequence, fee, i);
//             }, i * 200); // 200ms gap between transactions
//         }
//     } catch (e) {
//         console.error('❌ Error loading account or fee:', e.message);
//     }
// }

// // ========== RUN LOOP ==========
// const TPS = 5; // 🔁 Transactions per second (adjustable)

// setInterval(() => {
//     sendMultipleTransactions(TPS);
// }, 1000);


// const StellarSdk = require('stellar-sdk');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD';
// const recipient = 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS';
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();

// (async () => {
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const fee = await server.fetchBaseFee();

//         const tx = new StellarSdk.TransactionBuilder(account, {
//             fee,
//             networkPassphrase: 'Pi Network',
//         })
//             .addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: '1',
//             }))
//             .setTimeout(30)
//             .build();

//         tx.sign(senderKeypair);
//         const result = await server.submitTransaction(tx);

//         console.log("✅ Transaction success:", result.hash);
//     } catch (e) {
//         console.error("❌ Transaction error:", e.response?.data || e.message || e);
//     }
// })();


// const StellarSdk = require('stellar-sdk');
// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

// const senderSecret = 'SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD'; // ✅ তোমার Secret Key
// const recipient = 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS';    // ✅ তোমার Receiver Public Key

// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const networkPassphrase = 'Pi Network';

// // === একক ট্রানজ্যাকশন পাঠানো ফাংশন ===
// async function sendTransaction(sequence, fee, index) {
//     try {
//         const account = new StellarSdk.Account(senderPublic, sequence);

//         const tx = new StellarSdk.TransactionBuilder(account, {
//             fee,
//             networkPassphrase
//         })
//             .addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: "1", // অল্প পরিমাণ টেস্ট
//             }))
//             .setTimeout(30)
//             .build();

//         tx.sign(senderKeypair);
//         const result = await server.submitTransaction(tx);
//         console.log(`✅ Tx ${index + 1}: Success - Hash: ${result.hash}`);
//     } catch (e) {
//         console.error(`❌ Tx ${index + 1}: Failed`, e.response?.data?.extras?.result_codes || e.message);
//     }
// }

// // === প্রতি সেকেন্ডে ব্যাচ পাঠানো ===
// async function batchSendTPS(tps = 5) {
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const fee = await server.fetchBaseFee();
//         const baseSequence = BigInt(account.sequence);

//         for (let i = 0; i < tps; i++) {
//             const seq = (baseSequence + BigInt(i + 1)).toString();

//             setTimeout(() => {
//                 sendTransaction(seq, fee, i);
//             }, i * 200); // delay to avoid rate limit
//         }
//     } catch (e) {
//         console.error("❌ Error loading account or fee:", e.message);
//     }
// }

// // === প্রতিবার ৫টি পাঠাও প্রতি সেকেন্ডে ===
// setInterval(() => {
//     batchSendTPS(1);
// }, 3000);


// const StellarSdk = require('stellar-sdk');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

// // ✅ তোমার Secret Key এবং Receiver Key নিচে বসাও
// const senderSecret = 'SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD'; // sender
// const recipient = 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS';    // receiver

// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();

// (async () => {
//   try {
//     // ✅ Step 1: Account Load
//     const account = await server.loadAccount(senderPublic);
//     console.log('🔓 Sender account loaded');

//     // ✅ Step 2: Base Fee Load
//     const fee = await server.fetchBaseFee();
//     console.log('💰 Base fee:', fee);

//     // ✅ Step 3: Transaction Build
//     const transaction = new StellarSdk.TransactionBuilder(account, {
//       fee,
//       networkPassphrase: 'Pi Network',
//     })
//       .addOperation(StellarSdk.Operation.payment({
//         destination: recipient,
//         asset: StellarSdk.Asset.native(),
//         amount: '1', // অনেক ছোট টাকার ট্রানজ্যাকশন
//       }))
//       .setTimeout(30)
//       .build();

//     // ✅ Step 4: Sign & Submit
//     transaction.sign(senderKeypair);
//     const result = await server.submitTransaction(transaction);
//     console.log('✅ Transaction Success:', result.hash);
//     console.log(`🔗 View: https://api.mainnet.minepi.com/transactions/${result.hash}`);
//   } catch (error) {
//     // 🔥 Error Output
//     console.error('❌ Error:', error.response?.data || error.message || error);
//   }
// })();

const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

const senderSecret = 'SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD'; // তোমার secret key
const recipient = 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS';    // receiver address

const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
const senderPublic = senderKeypair.publicKey();

async function sendTransaction(sequence, fee, index) {
    try {
        const account = new StellarSdk.Account(senderPublic, sequence);

        const tx = new StellarSdk.TransactionBuilder(account, {
            fee,
            networkPassphrase: 'Pi Network'
        })
        .addOperation(StellarSdk.Operation.payment({
            destination: recipient,
            asset: StellarSdk.Asset.native(),
            amount: '1'
        }))
        .setTimeout(30)
        .build();

        tx.sign(senderKeypair);
        const result = await server.submitTransaction(tx);
        console.log(`✅ Tx ${index + 1} Success: ${result.hash}`);
    } catch (e) {
        console.error(`❌ Tx ${index + 1} Failed:`, e.response?.data?.extras?.result_codes || e.message);
    }
}

async function sendBatch(tps = 20) {
    try {
        const account = await server.loadAccount(senderPublic);
        const fee = await server.fetchBaseFee();
        const baseSequence = BigInt(account.sequence);

        for (let i = 0; i < tps; i++) {
            const seq = (baseSequence + BigInt(i + 1)).toString();

            // Delay to avoid rate limit, spread within 1 second
            setTimeout(() => {
                sendTransaction(seq, fee, i);
            }, i * 50); // 50 ms gap * 20 = 1000 ms (1 second)
        }
    } catch (e) {
        console.error('Error loading account or fee:', e.message);
    }
}

// Run every 1 second to send 20 transactions per second
setInterval(() => {
    sendBatch(1);
}, 5000);
