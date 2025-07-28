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

// const StellarSdk = require('stellar-sdk');
// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

// const senderSecret = 'SDEWKP36AFA4LOB5YKZJMWFOXZIJ5RQJ6BSDVSCAFY5OMTJILLYDW4SD'; // তোমার secret key
// const recipient = 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS';    // receiver address

// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();

// async function sendTransaction(sequence, fee, index) {
//     try {
//         const account = new StellarSdk.Account(senderPublic, sequence);

//         const tx = new StellarSdk.TransactionBuilder(account, {
//             fee,
//             networkPassphrase: 'Pi Network'
//         })
//         .addOperation(StellarSdk.Operation.payment({
//             destination: recipient,
//             asset: StellarSdk.Asset.native(),
//             amount: '1'
//         }))
//         .setTimeout(30)
//         .build();

//         tx.sign(senderKeypair);
//         const result = await server.submitTransaction(tx);
//         console.log(`✅ Tx ${index + 1} Success: ${result.hash}`);
//     } catch (e) {
//         console.error(`❌ Tx ${index + 1} Failed:`, e.response?.data?.extras?.result_codes || e.message);
//     }
// }

// async function sendBatch(tps = 20) {
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const fee = await server.fetchBaseFee();
//         const baseSequence = BigInt(account.sequence);

//         for (let i = 0; i < tps; i++) {
//             const seq = (baseSequence + BigInt(i + 1)).toString();

//             // Delay to avoid rate limit, spread within 1 second
//             setTimeout(() => {
//                 sendTransaction(seq, fee, i);
//             }, i * 50); // 50 ms gap * 20 = 1000 ms (1 second)
//         }
//     } catch (e) {
//         console.error('Error loading account or fee:', e.message);
//     }
// }

// // Run every 1 second to send 20 transactions per second
// setInterval(() => {
//     sendBatch(1);
// }, 5000);

// const StellarSdk = require('stellar-sdk');
// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SCWCZRYNU7EGMCKLSQ7XQ2OKQOV7OAR7EUHKHEBX6A3CCXJNMC5KZJUP';
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';

// let currentSequence = null;

// async function init() {
//     const account = await server.loadAccount(senderKeypair.publicKey());
//     currentSequence = account.sequence;
//     console.log("🚀 Starting sequence:", currentSequence);
//     fire10TransactionsEverySecond();
// }

// async function fire10TransactionsEverySecond() {
//     setInterval(async () => {
//         for (let i = 0; i < 10; i++) {
//             try {
//                 await sendTxWithManualSequence(i + 1);
//             } catch (e) {
//                 console.error("❌ TX failed:", e.response?.data || e.message);
//             }
//         }
//     }, 1000);
// }

// async function sendTxWithManualSequence(id) {
//     const fee = await server.fetchBaseFee();
//     const account = new StellarSdk.Account(senderKeypair.publicKey(), (++currentSequence).toString());

//     const tx = new StellarSdk.TransactionBuilder(account, {
//         fee,
//         networkPassphrase: 'Pi Network',
//     })
//         .addOperation(StellarSdk.Operation.payment({
//             destination: recipient,
//             asset: StellarSdk.Asset.native(),
//             amount: "1", // low amount for testing
//         }))
//         .setTimeout(30)
//         .build();

//     tx.sign(senderKeypair);
//     const result = await server.submitTransaction(tx);
//     console.log(`✅ TX ${id}:`, result.hash);
// }


// const StellarSdk = require('stellar-sdk');
// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

// const senderSecret = 'SCWCZRYNU7EGMCKLSQ7XQ2OKQOV7OAR7EUHKHEBX6A3CCXJNMC5KZJUP';
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';

// // Customize this
// const AMOUNT = "0.0001"; // small amount for test
// const NETWORK_PASSPHRASE = 'Pi Network';

// let currentSequence = null;
// let txCounter = 1;

// async function init() {
//     console.log("🔄 Loading account...");
//     try {
//         const account = await server.loadAccount(senderKeypair.publicKey());
//         currentSequence = account.sequence;
//         console.log("✅ Account loaded. Starting sequence:", currentSequence);
//         startSending();
//     } catch (err) {
//         console.error("❌ Failed to load account:", err);
//     }
// }

// function startSending() {
//     setInterval(() => {
//         for (let i = 0; i < 10; i++) {
//             sendTransaction(txCounter++);
//         }
//     }, 1000); // every 1 second
// }

// async function sendTransaction(id) {
//     try {
//         const fee = await server.fetchBaseFee();
//         currentSequence = (BigInt(currentSequence) + 1n).toString();
//         const account = new StellarSdk.Account(senderKeypair.publicKey(), currentSequence);

//         const tx = new StellarSdk.TransactionBuilder(account, {
//             fee,
//             networkPassphrase: NETWORK_PASSPHRASE,
//         })
//             .addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: AMOUNT,
//             }))
//             .setTimeout(30)
//             .build();

//         tx.sign(senderKeypair);

//         console.log(`🚀 TX ${id} submitting... [seq: ${currentSequence}]`);

//         const result = await server.submitTransaction(tx);
//         console.log(`✅ TX ${id} SUCCESS:`, result.hash);

//     } catch (err) {
//         if (err.response && err.response.data) {
//             console.error(`❌ TX ${id} FAILED (API Error):`, JSON.stringify(err.response.data, null, 2));
//         } else {
//             console.error(`❌ TX ${id} FAILED (Unknown Error):`, err);
//         }
//     }
// }

// init();


// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

// // 🔐 Main account (sender)
// const sourceSecret = 'SCWCZRYNU7EGMCKLSQ7XQ2OKQOV7OAR7EUHKHEBX6A3CCXJNMC5KZJUP'; // <-- তোমার Sender Wallet Secret
// const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
// const sourcePublic = sourceKeypair.publicKey();

// const recipients = [
//   { address: 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI', amount: '8' },
//   { address: 'MDFNWH6ZFJVHJDLBMNOUT35X4EEKQVJAO3ZDL4NL7VQJLC4PJOQFWAAAAABABJPIMYECS', amount: '10' },
//   { address: 'GBQGBQSQRORPBDC7YCPL6JKABCMVZ5OXF7IGEIT34V4WJH52IBP2T2AS', amount: '12' },
 
// ];

// // 🔁 প্রতি সেকেন্ডে ১টি multi-op Tx পাঠানো
// setInterval(async () => {
//   try {
//     console.log('🚀 Sending 10 transfers in 1 transaction...');

//     const account = await server.loadAccount(sourcePublic);
//     const fee = await server.fetchBaseFee();

//     const txBuilder = new StellarSdk.TransactionBuilder(account, {
//       fee: (fee * recipients.length).toString(), // e.g. 100000 * 10 = 1000000
//       networkPassphrase: 'Pi Network',
//     });

//     // ➕ Add all payment operations
//     for (let i = 0; i < recipients.length; i++) {
//       txBuilder.addOperation(StellarSdk.Operation.payment({
//         destination: recipients[i].address,
//         asset: StellarSdk.Asset.native(),
//         amount: recipients[i].amount,
//       }));
//     }

//     const tx = txBuilder.setTimeout(30).build();
//     tx.sign(sourceKeypair);

//     const result = await server.submitTransaction(tx);
//     console.log("✅ Tx Success:", result.hash);
//     console.log("🔗 Tx Link:", `https://api.mainnet.minepi.com/transactions/${result.hash}`);
//   } catch (e) {
//     console.error("❌ Tx Error:", e?.response?.data?.extras || e.message);
//   }
// }, 3000); // প্রতি 1 সেকেন্ডে repeat


//  // final code
 const StellarSdk = require('stellar-sdk');
 const axios = require('axios');

const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
const senderSecret = 'SB4WSGATOOQDV7KRVBXU5MIK7UW4QL62EKV6JFMYX3ERRUMSH6JSJ4IX'; // YOUR SENDER SECRET
const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
const senderPublic = senderKeypair.publicKey();
console.log(`Sender public key: ${senderPublic}`);
const apiUrl = `https://api.mainnet.minepi.com/accounts/${senderPublic}`;

// ===== ১০০ বার payment পাঠানোর জন্য recipient গুলোর একটা array তৈরি করছি =====
// এখানে তোমার প্রয়োজন মতো ঠিকানা বসাবে, এখন উদাহরণ স্বরূপ ১০০ বার একই recipient দেয়া হয়েছে
const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';
const recipients = Array(10).fill(recipient); // ১০০ বার একই ঠিকানা

async function sendPi(po) {
    console.log(po);
    try {
        console.log('🔐 Sender Public Key:', senderPublic);
        const account = await server.loadAccount(senderPublic);
        const fee = await server.fetchBaseFee(); // এটা number
        console.log(`Base fee per operation: ${fee}`);

        const res = await axios.get(apiUrl);
        const balance = res.data.balances[0].balance; // string
        console.log(`Pi Balance : ${balance}`);

        // প্রতিটিতে কত amount পাঠাবে (উদাহরণে 0.01)
        const amountPerOperation = '200';

        // মোট fee = baseFee * ১০০ অপারেশন
        // const totalFee = fee * recipients.length;
          const totalFee = fee ;

        const txBuilder = new StellarSdk.TransactionBuilder(account, {
            fee: totalFee.toString(),
            networkPassphrase: 'Pi Network',
        });

        // ১০০ বার payment operation add করছি
        for (let i = 0; i < recipients.length; i++) {
            txBuilder.addOperation(StellarSdk.Operation.payment({
                destination: recipients[i],
                asset: StellarSdk.Asset.native(),
                amount: amountPerOperation,
            }));
        }

        const tx = txBuilder.setTimeout(60).build();

        tx.sign(senderKeypair);
        const result = await server.submitTransaction(tx);
        console.log("Tx Hash:", result.hash);
        console.log("View Tx:", `https://api.mainnet.minepi.com/transactions/${result.hash}`);
    } catch (e) {
        console.error('❌ Error:', e.response?.data?.extras?.result_codes || e.message || e);
    }
}

// প্রতি ৩ সেকেন্ডে কল করবে
setInterval(() => {
    sendPi("Sending 100 payments in one transaction");
}, 3000);



// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SCWCZRYNU7EGMCKLSQ7XQ2OKQOV7OAR7EUHKHEBX6A3CCXJNMC5KZJUP'; // YOUR SENDER SECRET
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// console.log(`Sender public key: ${senderPublic}`);
// const apiUrl = `https://api.mainnet.minepi.com/accounts/${senderPublic}`;

// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';
// const recipients = Array(5).fill(recipient); // ১০০ বার একই ঠিকানা

// async function sendPi(po) {
//     console.log(po);
//     try {
//         console.log('🔐 Sender Public Key:', senderPublic);

//         // একাউন্ট লোড
//         const account = await server.loadAccount(senderPublic);

//         // base fee per operation (number)
//         const fee = await server.fetchBaseFee();
//         console.log(`Base fee per operation: ${fee}`);

//         // ব্যালেন্স চেক
//         const res = await axios.get(apiUrl);
//         const balance = res.data.balances[0].balance;
//         console.log(`Pi Balance : ${balance}`);

//         const amountPerOperation = '100'; // প্রতিটিতে পেমেন্ট পরিমাণ
//         const totalFee = fee * recipients.length;
//         console.log(`Total fee for ${recipients.length} operations: ${totalFee}`);

//         const txBuilder = new StellarSdk.TransactionBuilder(account, {
//             fee: totalFee.toString(),
//             networkPassphrase: 'Pi Network',
//         });

//         // ১০০টি payment অপারেশন অ্যাড করা
//         for (let i = 0; i < recipients.length; i++) {
//             txBuilder.addOperation(StellarSdk.Operation.payment({
//                 destination: recipients[i],
//                 asset: StellarSdk.Asset.native(),
//                 amount: amountPerOperation,
//             }));
//         }

//         const tx = txBuilder.setTimeout(60).build();
//         tx.sign(senderKeypair);

//         // সাবমিট এবং ফলাফল
//         const result = await server.submitTransaction(tx);
//         console.log("✅ Transaction successful!");
//         console.log("Tx Hash:", result.hash);
//         console.log("View Tx:", `https://api.mainnet.minepi.com/transactions/${result.hash}`);
//     } catch (e) {
//         if (e.response && e.response.data) {
//             console.error('❌ Transaction failed with response:', JSON.stringify(e.response.data, null, 2));
//         } else {
//             console.error('❌ Transaction failed:', e.message || e);
//         }
//     }
// }

// // প্রতি ৩ সেকেন্ডে কল করবে
// setInterval(() => {
//     sendPi("Sending 100 payments in one transaction...");
// }, 3000);


// second final 1 pi fee0.1
// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// // === Pi Network Horizon Server ===
// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// //StellarSdk.Networks.use(new StellarSdk.Network('Pi Network'));

// // === Sender Account Info ===
// const senderSecret = 'SBAZ2UZ763EFNDE2D37BRQMQVBUSHRSQOQ3EVHR274ZXCCIGP72DUKEM'; // Replace with your secret
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const apiUrl = `https://api.mainnet.minepi.com/accounts/${senderPublic}`;

// // === Recipient (Can be same or dynamic) ===
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';

// // === Config ===
// const paymentCount = 2;
// const paymentAmount = '500'; // Pi per operation

// // === Main Payment Function ===
// async function sendPi(message = '') {
//     try {
//         console.log(`\n🚀 Triggered: ${message}`);
//         console.log(`🔐 Sender: ${senderPublic}`);
        
//         const account = await server.loadAccount(senderPublic);
//         const feePerOp = await server.fetchBaseFee(); // 100000
//         const totalFee = feePerOp * paymentCount;

//         const res = await axios.get(apiUrl);
//         const currentBalance = parseFloat(res.data.balances[0].balance);
//         const totalSend = parseFloat(paymentAmount) * paymentCount;
//         const feeInPi = totalFee / 1e7;

//         console.log(`💰 Balance: ${currentBalance} Pi`);
//         console.log(`📦 Total Send: ${totalSend} Pi`);
//         console.log(`💸 Total Fee: ${feeInPi} Pi`);

//      //   if (currentBalance < totalSend + feeInPi) {
//         //     console.error(`❌ Not enough balance! Required: ${totalSend + feeInPi}, Available: ${currentBalance}`);
//         //     return;
//         // }

//         // Build transaction with 100 operations
//         let txBuilder = new StellarSdk.TransactionBuilder(account, {
//             fee: totalFee.toString(),
//             networkPassphrase: 'Pi Network',
//         });

//         for (let i = 0; i < paymentCount; i++) {
//             txBuilder = txBuilder.addOperation(
//                 StellarSdk.Operation.payment({
//                     destination: recipient,
//                     asset: StellarSdk.Asset.native(),
//                     amount: paymentAmount,
//                 })
//             );
//         }

//         const tx = txBuilder.setTimeout(30).build();
//         tx.sign(senderKeypair);

//         const result = await server.submitTransaction(tx);
//         console.log(`✅ SUCCESS! Tx Hash: ${result.hash}`);
//         console.log(`🔗 View Tx: https://api.mainnet.minepi.com/transactions/${result.hash}`);

//     } catch (e) {
//         const err = e.response?.data?.extras?.result_codes || e.message || e;
//         console.error('❌ Transaction Error:', err);
//     }
// }

// // 🔁 Run every 3 seconds
// setInterval(() => {
//     sendPi("🔥 100 Pi ops triggered");
// }, 3000);


// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SCWCZRYNU7EGMCKLSQ7XQ2OKQOV7OAR7EUHKHEBX6A3CCXJNMC5KZJUP'; // Replace with your real secret key
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();

// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI'; // Receiver address

// async function send100Payments() {
//     try {
//         console.log(`🔐 Sender Public Key: ${senderPublic}`);

//         const account = await server.loadAccount(senderPublic);
//         const fee = await server.fetchBaseFee();

//         const res = await axios.get(`https://api.mainnet.minepi.com/accounts/${senderPublic}`);
//         const balance = parseFloat(res.data.balances[0].balance);
//         console.log(`Pi Balance: ${balance}`);

//         const withdrawAmount = 102; // Small amount for each op
//         const totalAmount = withdrawAmount * 100;

//         // if (balance < totalAmount + 0.01) {
//         //     console.error("❌ Not enough balance to send 100 operations.");
//         //     return;
//         // }

//         const txBuilder = new StellarSdk.TransactionBuilder(account, {
//             fee: (fee * 10).toString(), // 100 operations × base fee
//             networkPassphrase: 'Pi Network',
//         });

//         for (let i = 0; i < 10; i++) {
//             txBuilder.addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: withdrawAmount.toFixed(7), // always 7 digits after decimal
//             }));
//         }

//         const tx = txBuilder.setTimeout(30).build();
//         tx.sign(senderKeypair);

//         const result = await server.submitTransaction(tx);
//         console.log("✅ Success!");
//         console.log("Tx Hash:", result.hash);
//         console.log("View Tx:", `https://api.mainnet.minepi.com/transactions/${result.hash}`);
//     } catch (err) {
//         console.error("❌ Error:", err.response?.data?.extras?.result_codes || err.message || err);
//     }
// }

// // প্রতি 3 সেকেন্ড পর পর 100 পেমেন্ট পাঠাবে
// setInterval(send100Payments, 5000);


// //require("dotenv").config();
// const StellarSdk = require("stellar-sdk");

// // Network and Horizon setup
// const server = new StellarSdk.Server("https://api.mainnet.minepi.com");
// const networkPassphrase = "Pi Network";

// // Load keypair
// const senderSecret = "SCWCZRYNU7EGMCKLSQ7XQ2OKQOV7OAR7EUHKHEBX6A3CCXJNMC5KZJUP";
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const recipient = "GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI";

// async function send100Payments() {
//     try {
//         // Load account
//         const account = await server.loadAccount(senderPublic);

//         // Fetch base fee
//         const baseFee = await server.fetchBaseFee(); // Usually 100000
//         const operationCount = 100;
//         const totalFee = (baseFee * operationCount).toString(); // Total fee for 100 ops

//         console.log("🔐 Sender Public Key:", senderPublic);
//         console.log("📤 Sending 100 payments in one transaction...");
//         console.log("💸 Base fee per operation:", baseFee);
//         console.log("💰 Total fee for 100 ops:", totalFee);

//         // Start building transaction
//         const txBuilder = new StellarSdk.TransactionBuilder(account, {
//             fee: totalFee,
//             networkPassphrase,
//         });

//         // Add 100 payment operations
//         for (let i = 0; i < operationCount; i++) {
//             txBuilder.addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: "106", // You can increase this
//             }));
//         }

//         // Finalize transaction
//         const transaction = txBuilder.setTimeout(30).build();
//         transaction.sign(senderKeypair);

//         // Submit transaction
//         const result = await server.submitTransaction(transaction);
//         console.log("✅ Transaction successful!");
//         console.log("🔗 Tx Hash:", result.hash);
//         console.log(`🌐 View Tx: https://api.mainnet.minepi.com/transactions/${result.hash}`);
//     } catch (error) {
//         console.error("❌ Error submitting transaction:", error.response?.data || error.message);
//     }
// }

// //send100Payments();


//  setInterval(send100Payments, 5000);




// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SCWCZRYNU7EGMCKLSQ7XQ2OKQOV7OAR7EUHKHEBX6A3CCXJNMC5KZJUP';
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI'; // একই address 100 বার পাঠাতে চাইলে

// async function sendBulkPayments() {
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const baseFee = await server.fetchBaseFee();
//         const numberOfPayments = 100;
//         const fee = (baseFee * numberOfPayments).toString(); // ঠিকভাবে গুণ করতে হবে

//         const txBuilder = new StellarSdk.TransactionBuilder(account, {
//             fee,
//             networkPassphrase: 'Pi Network',
//         });

//         for (let i = 0; i < numberOfPayments; i++) {
//             txBuilder.addOperation(StellarSdk.Operation.payment({
//                 destination: recipient,
//                 asset: StellarSdk.Asset.native(),
//                 amount: "0.00001" // ছোট এমাউন্ট, একই এমাউন্ট ১০০ বার যাবে
//             }));
//         }

//         const transaction = txBuilder.setTimeout(30).build();
//         transaction.sign(senderKeypair);

//         const txResult = await server.submitTransaction(transaction);
//         console.log("✅ Tx Hash:", txResult.hash);
//         console.log("🔗 View:", `https://api.mainnet.minepi.com/transactions/${txResult.hash}`);

//     } catch (error) {
//         console.error("❌ Error:", error.response?.data?.extras?.result_codes || error);
//     }
// }

// sendBulkPayments();



// const StellarSdk = require('stellar-sdk');

// // 🔐 Sender's secret and public key
// const senderSecret = 'SBAZ2UZ763EFNDE2D37BRQMQVBUSHRSQOQ3EVHR274ZXCCIGP72DUKEM';
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI'; // একই address ১০০ বার হলে এটাকেই ১০০ বার use হবে

// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();

// // 🌐 Pi Network server
// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const networkPassphrase = 'Pi Network';

// // 🧠 Utility function
// async function send100Payments() {
//   try {
//     // 🔄 Load sender account
//     const account = await server.loadAccount(senderPublic);

//     // 🔢 100 operations
//     const operationCount = 10;
//     const baseFee = 100000; // Pi network base fee per operation
//     const totalFee = (operationCount * baseFee).toString(); // Must be string

//     // 📦 Create transaction
//     const txBuilder = new StellarSdk.TransactionBuilder(account, {
//       fee: totalFee,
//       networkPassphrase
//     });

//     // ➕ Add 100 payment operations
//     for (let i = 0; i < operationCount; i++) {
//       txBuilder.addOperation(StellarSdk.Operation.payment({
//         destination: recipient,
//         asset: StellarSdk.Asset.native(),
//         amount: '10'
//       }));
//     }

//     // ✅ Build and sign
//     const transaction = txBuilder.setTimeout(60).build();
//     transaction.sign(senderKeypair);

//     // 📤 Submit transaction
//     const result = await server.submitTransaction(transaction);
//     console.log("✅ Transaction successful!");
//     console.log("🔗 Tx Hash:", result.hash);
//     console.log("🌐 View: https://api.mainnet.minepi.com/transactions/" + result.hash);

//   } catch (err) {
//     console.error("❌ Error submitting transaction:");
//     if (err.response?.data) {
//       console.error(JSON.stringify(err.response.data, null, 2));
//     } else {
//       console.error(err);
//     }
//   }
// }

// send100Payments();



// const StellarSdk = require('stellar-sdk');
// const axios = require('axios');

// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const senderSecret = 'SBAZ2UZ763EFNDE2D37BRQMQVBUSHRSQOQ3EVHR274ZXCCIGP72DUKEM';
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();
// const apiUrl = `https://api.mainnet.minepi.com/accounts/${senderPublic}`;

// // 100 বার payment (এখানে 100 বার same recipient use করা হয়েছে)
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';
// const recipients = Array(8).fill(recipient); // try 10/20/50/100 to test

// async function sendPi(po) {
//     console.log(po);
//     try {
//         const account = await server.loadAccount(senderPublic);
//         const fee = await server.fetchBaseFee();
//         const res = await axios.get(apiUrl);
//         const balance = res.data.balances[0].balance;

//         console.log(`Balance: ${balance} Pi`);
//         console.log(`Base Fee: ${fee} stroops`);

//         const totalFee = (fee * recipients.length).toString();
//         const txBuilder = new StellarSdk.TransactionBuilder(account, {
//             fee: totalFee,
//             networkPassphrase: 'Pi Network',
//         });

//         const amountPerOperation = '0.00001'; // Small amount to avoid overflow

//         for (let i = 0; i < recipients.length; i++) {
//             txBuilder.addOperation(StellarSdk.Operation.payment({
//                 destination: recipients[i],
//                 asset: StellarSdk.Asset.native(),
//                 amount: amountPerOperation,
//             }));
//         }

//         const tx = txBuilder.setTimeout(60).build();
//         tx.sign(senderKeypair);

//         const result = await server.submitTransaction(tx);
//         console.log("✅ Tx Hash:", result.hash);
//         console.log("🔗 View:", `https://api.mainnet.minepi.com/transactions/${result.hash}`);

//     } catch (e) {
//         console.error('❌ Error:', e.response?.data?.extras?.result_codes || e.message || e);
//     }
// }

// sendPi("Sending 100 payments...");



// const StellarSdk = require('stellar-sdk');

// // Sender info
// const senderSecret = 'SBAZ2UZ763EFNDE2D37BRQMQVBUSHRSQOQ3EVHR274ZXCCIGP72DUKEM'; // তোমার গোপন key
// const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
// const senderPublic = senderKeypair.publicKey();

// // Pi Network Horizon Server
// const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
// const networkPassphrase = 'Pi Network';

// // Receiver
// const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI'; // Receiver Address

// // Batch config
// const totalOperations = 160;
// const maxOpsPerTx = 7;
// const amount = '10'; // প্রতি operation 0.01 Pi

// // Helper: Split array into chunks
// function chunkArray(arr, size) {
//   return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
//     arr.slice(i * size, i * size + size)
//   );
// }

// // Main function
// async function startTransfers() {
//   const recipients = Array(totalOperations).fill(recipient);
//   const batches = chunkArray(recipients, maxOpsPerTx);

//   for (let i = 0; i < batches.length; i++) {
//     console.log(`🚀 Sending Tx ${i + 1}/${batches.length} (${batches[i].length} ops)`);

//     try {
//       const account = await server.loadAccount(senderPublic);
//       const fee = await server.fetchBaseFee();

//       const txBuilder = new StellarSdk.TransactionBuilder(account, {
//         fee: (fee * batches[i].length).toString(),
//         networkPassphrase,
//       });

//       batches[i].forEach(dest => {
//         txBuilder.addOperation(StellarSdk.Operation.payment({
//           destination: dest,
//           asset: StellarSdk.Asset.native(),
//           amount,
//         }));
//       });

//       const tx = txBuilder.setTimeout(60).build();
//       tx.sign(senderKeypair);

//       const result = await server.submitTransaction(tx);
//       console.log(`✅ Tx Success: ${result.hash}`);
//     } catch (e) {
//       console.error('❌ Tx Error:', e?.response?.data?.extras?.result_codes || e.message || e);
//     }

//     await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between tx
//   }

//   console.log('🎉 All transfers completed!');
// }

// startTransfers();

