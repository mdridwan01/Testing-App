const StellarSdk = require('stellar-sdk');
const axios = require('axios');

const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
const senderSecret = 'SD62ZDBAB6CLIF7AAM5RZZRSCGYAIJJEI32YT2ZGQ75ETOGMG5I6VQGA'; // YOUR SENDER SECRET
const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
const senderPublic = senderKeypair.publicKey();
const apiUrl = `https://api.mainnet.minepi.com/accounts/${senderPublic}`;
const recipient = 'GA4UDWS5GKMDCD7EQKK3ST7MJ3BFNHW4Z3KYS26GLUKD764TJA46QDDI';

async function sendPi(po) {
    console.log(po);
    try {
        console.log('🔐 Sender Public Key:', senderPublic);
        const account = await server.loadAccount(senderPublic);
        const fee = (await server.fetchBaseFee()).toString();
        // console.log(fee) // 100000
        console.log(typeof fee); // string

        const res = await axios.get(apiUrl);
        const amount1 = res.data.balances[0].balance; // '0.9815688'
        console.log(typeof amount1) // string
        console.log(`Pi Balance : ${res.data.balances[0].balance}`);

        // const withdrawAmount = Number(amount1) - Number("0.01")
         const withdrawAmount = Number("983");
        console.log(`Withdraw Amount: ${withdrawAmount}`);
        console.log(typeof withdrawAmount.toString())

        const tx = new StellarSdk.TransactionBuilder(account, {
            fee,
            networkPassphrase: 'Pi Network',
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: recipient,
                asset: StellarSdk.Asset.native(),
                amount: withdrawAmount.toString(),
            }))
            .setTimeout(30)
            .build();

        tx.sign(senderKeypair);
        const result = await server.submitTransaction(tx);
        console.log("Tx Hash:", result.hash);
        console.log("View Tx:", `https://api.mainnet.minepi.com/transactions/${result.hash}`);
    } catch (e) {
        console.error('❌ Error:', e.response?.data?.extras?.result_codes || e);
    }
}


// Send every 3 seconds
setInterval(() => {
    sendPi("Hi1");
}, 1000);


// Send every 3 seconds
setInterval(() => {
    sendPi("hi2");
}, 2000);

setInterval(() => {
    sendPi("Hi3");
}, 3000);


// // Send every 3 seconds
// setInterval(() => {
//     sendPi("hi2");
// }, 4000);
// setInterval(() => {
//     sendPi("Hi3");
// }, 3000);


// // Send every 3 seconds
// setInterval(() => {
//     sendPi("hi4");
// }, 5000);

// setInterval(() => {
//     sendPi("Hi5");
// }, 500);


// // Send every 3 seconds
// setInterval(() => {
//     sendPi("hi6");
// }, 700);

// setInterval(() => {
//     sendPi("Hi7");
// }, 900);


// // Send every 3 seconds
// setInterval(() => {
//     sendPi("hi8");
// }, 900);

// setInterval(() => {
//     sendPi("Hi9");
// }, 6000);


// // Send every 3 seconds
// setInterval(() => {
//     sendPi("hi10");
// }, 1500);