const axios = require("axios");
const StellarSdk = require("stellar-sdk");



async function decode() {
    const url = `https://api.mainnet.minepi.com/accounts/GCB42CQEH5NM7RV7ZAV3BZTGFHD7YIIAQXL2BJHMJAMMK5TT3E52XFBT/operations?order=desc&limit=1`;

    try {
        const res = await axios.get(url);
        const operation = res.data._embedded.records[0];
        // Latest Operation
        console.log(`🧾 Type: `, operation.type);
        console.log(`🔑 From: `, operation.from);
        console.log(`📥 To: `, operation.to);
        console.log(`💰 Amount: `, operation.amount);
    } catch (error) {
        console.log(`Error decoding operation:`, error.message);
    }
}
decode()