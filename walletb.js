const axios = require('axios');

const walletAddress = "GB2RKMV7GHGFSSIDQSVUZXZ4IEFDD2EPWA6V4FBH3ERGVZEZSWPEOJPP";
const apiUrl = `https://api.mainnet.minepi.com/accounts/${walletAddress}`;
// 

async function getPiBalance() {
  try {
    const res = await axios.get(apiUrl);
    console.log(`Pi Balance : ${res.data.balances[0].balance}`); // Inspect this for balance, etc.
  } catch (err) {
    console.error("Could not fetch balance:", err.message);
  }
}

getPiBalance();