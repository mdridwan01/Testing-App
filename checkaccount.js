const stellar = require("@stellar/stellar-sdk");
const server = new stellar.Horizon.Server("https://api.mainnet.minepi.com");
const publicKey = "GB4ZLRJ5SU23HS6M6IRW6NR6Y4OPEFXY34ZPWYX6LF3U6PC64MAC7OKN";

async function checkAccount() {
    try {
        const account = await server.loadAccount(publicKey);
        console.log(`Account ID: ${account.operations}`);
        account.balances.forEach((balance) => {
            console.log(`Asset : ${balance.asset_type}, Balance : ${balance.balance}`);
        })
    } catch (error) {
        console.log(error);
    }
}

checkAccount();