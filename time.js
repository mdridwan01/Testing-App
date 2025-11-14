// npm i stellar-sdk dotenv axios
require('dotenv').config();
const StellarSdk = require('stellar-sdk');
const axios = require('axios');

// Load environment variables from .env file
const HORIZON_URL = process.env.HORIZON_URL || 'https://api.mainnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Pi Network';
const SENDER_SECRET = process.env.SENDER_SECRET;
const RECIPIENT = process.env.RECIPIENT;
const BUFFER_STROOPS = BigInt(process.env.BUFFER_STROOPS || 10000n); // ~0.001 native
const CHANNEL_SECRETS = process.env.CHANNEL_SECRETS.split(',').map(s => s.trim()).filter(Boolean);
const QUEUE_CONCURRENCY = Number(process.env.QUEUE_CONCURRENCY || 1);

// Create a Stellar server instance to interact with the network
const server = new StellarSdk.Server(HORIZON_URL);
const senderKeypair = StellarSdk.Keypair.fromSecret(SENDER_SECRET);
const senderPublic = senderKeypair.publicKey();
console.log(`Sender public key: ${senderPublic}`);

// Utility function to get current time
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

console.log('Current time:', getCurrentTime());

// Function to manually set the claim time (can be set via .env or hardcoded)
const MANUAL_TIME = process.env.MANUAL_TIME || '2025-11-15 12:00:00';  // Set your desired time here

// Helper function to convert amount to stroops (1 XLM = 10 million stroops)
function toStroops(amountStr) {
  const [i, fRaw = ''] = String(amountStr).split('.');
  const f = (fRaw + '0000000').slice(0, 7);
  return BigInt(i || '0') * 10_000_000n + BigInt(f || '0');
}

function fromStroops(stroops) {
  const sign = stroops < 0 ? '-' : '';
  let s = stroops < 0 ? -stroops : stroops;
  const i = s / 10_000_000n;
  const f = s % 10_000_000n;
  const fStr = f.toString().padStart(7, '0').replace(/0+$/, '');
  return sign + i.toString() + (fStr ? '.' + fStr : '');
}

// Retry function to handle API failures (e.g., rate-limiting)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function withRetry(fn, { tries = 5, base = 500 } = {}) {
  for (let a = 1; a <= tries; a++) {
    try {
      return await fn();
    } catch (e) {
      const status = e.response?.status;
      if (![429, 502, 503, 504].includes(status) || a === tries) throw e;
      const wait = base * 2 ** (a - 1);
      console.warn(`⌛ transient ${status} → retry in ${wait}ms`);
      await sleep(wait);
    }
  }
}

// Function to retrieve the account balance and sequence number
async function getAccountInfo() {
  const account = await server.loadAccount(senderPublic);
  const fee = await server.fetchBaseFee();
  const sequence = account.sequence;
  console.log(`Current sequence number: ${sequence}`);
  return { account, fee, sequence, claimableBalances: account.balances };
}

// Function to handle the claim and transfer operations
async function claimAndTransfer() {
  try {
    // Get account details and prepare for transaction
    const { account, fee, sequence, claimableBalances } = await getAccountInfo();

    // Get the first claimable balance ID (replace with actual logic to select balance)
    const claimableBalance = claimableBalances.find(balance => balance.asset_type === "native"); // Example filter
    if (!claimableBalance) {
      console.log('No claimable balance available.');
      return;
    }

    const balanceId = claimableBalance.id;  // Claimable balance ID
    const amount = claimableBalance.balance; // Balance to claim (string)
    console.log(`Claimable balance ID: ${balanceId}`);
    console.log(`Claimable Balance: ${amount}`);

    // Set the transaction fee and sequence
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.claimClaimableBalance({
        balanceId: balanceId,  // The actual balanceId for the claimable balance
        source: senderPublic,
      }))
      .addOperation(StellarSdk.Operation.payment({
        destination: RECIPIENT,
        asset: StellarSdk.Asset.native(),
        amount: '10',  // Example amount, adjust accordingly
        source: senderPublic,
      }))
      .setTimeout(30)
      .build();

    // Sign the transaction with the sender's keypair
    tx.sign(senderKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(tx);
    console.log("Transaction Hash:", result.hash);
    console.log("View Transaction:", `https://api.mainnet.minepi.com/transactions/${result.hash}`);
  } catch (error) {
    console.error('❌ Error in claim and transfer:', error.message || error);
  }
}

// Manually trigger the transaction process (set interval or invoke as needed)
setInterval(() => {
  claimAndTransfer();
}, 5000);  // Polling every 5 seconds (adjustable)
