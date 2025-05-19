const StellarSdk = require('stellar-sdk');
const axios = require('axios');

const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

const senderSecret = 'few announce apple deliver pioneer regular dice someone enrich festival soccer rice critic quiz pride venue boil corn angle piano sugar pioneer grocery save';
const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
const senderPublic = senderKeypair.publicKey();

const apiUrl = `https://api.mainnet.minepi.com/accounts/${senderPublic}`;
const recipient = 'GD2E7TJ62WCVTPYORLVLG4QP3VWGDJA2VMUOZSIQOITKSZRJCSFFNSCG';

async function sendPi() {
  try {
    console.log('🔐 Sender:', senderPublic);

    const account = await server.loadAccount(senderPublic);
    
    const baseFee = await server.fetchBaseFee();
    const fee = (baseFee).toString(); // Dynamically doubled gas fee
    console.log(`⛽ Base Fee: ${baseFee}, Doubled Fee: ${fee}`);

    const res = await axios.get(apiUrl);
    const balance = res.data.balances[0].balance;
    console.log(`Pi Balance: ${balance}`);

    const withdrawAmount = Number(balance) - 2;
    if (withdrawAmount <= 0) {
      console.log("⚠️ Not enough Pi to send. Skipping...");
    } else {
      const formattedAmount = withdrawAmount.toFixed(7).toString();
      console.log(`➡️ Sending: ${formattedAmount} Pi`);

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee,
        networkPassphrase: 'Pi Network',
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: recipient,
          asset: StellarSdk.Asset.native(),
          amount: formattedAmount,
        }))
        .setTimeout(15)
        .build();

      tx.sign(senderKeypair);

      const result = await server.submitTransaction(tx);

      if (result && result.transaction_hash !== false) {
        console.log("✅ Tx Hash:", result);
        console.log(`🔗 View Tx: https://api.mainnet.minepi.com/transactions/${result.hash}`);
      } else {
        console.log("⚠️ Transaction submitted but not confirmed successful:", result);
      }
    }
  } catch (e) {
    console.error('❌ Error:', e.response?.data?.extras?.result_codes || e.message || e);
  } finally {
    setTimeout(sendPi, 499); // Run again after 999 ms
  }
}

sendPi(); // Start the loop
