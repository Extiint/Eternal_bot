//const { contractAbi, contractAddress } = require('./web3/Abitest');
const { contractAbi, contractAddress } = require('./web3/Abi');

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 49152

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  
require('dotenv').config();
const { ethers } = require('ethers');
const Big = require('big.js');
const httpProvider = new ethers.JsonRpcProvider('https://long-autumn-meme.bsc.discover.quiknode.pro/2bc745f7db00bf614121c5293deea1cc933b52c6/');
//const httpProvider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');

const contract = new ethers.Contract(contractAddress, contractAbi, httpProvider);

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: { interval: 1000 } });
const chatId = '@lotterytest001';


bot.on('polling_error', (err) => {
  console.error('Polling error:', err);
});

bot.onText(/nowtalk001/, async (msg, match) => {
  try {
    const chatId2 = '@lotterytest001';
    await bot.sendMessage(chatId2, 'Hello!');
  } catch (err) {
    console.error('Error in nowtalk001 command:', err);
  }
});

function handleBuyEvent(addr, amount) {
  try {
    console.log('Received event:', { addr , amount});
    const newamount = new Big(Number(amount)).div(new Big('1e18')).toFixed(2);
    
    contract.getContractBalance()
      .then((balance) => {
        const bscScanLink = `https://bscscan.com/tx/${addr}`
        const balance2 = new Big(Number(balance)).div(new Big('1e18')).toFixed(2);

         // calculate number of emojis to send
         const numEmojis = Math.floor(newamount / 10);
         let emojis = '';
         for (let i = 0; i < numEmojis; i++) {
           emojis += '🚀'; // add rocket emoji
         }
        
        bot.sendPhoto(chatId, 'https://ipfs.filebase.io/ipfs/Qmc1xMaiD8WQVyJEqwxJR3KaYsSCFjgFTp1dRUy6ChtxFU', {
          caption: `💰 <b>New USDC deposit detected! 💰</b>\n\n ${emojis} \n\n<b>Total Balance:</b> ${balance2} \n<b>Deposit Amount:</b> ${newamount} BUSD \n\n<a href="${bscScanLink}"><u>Tx</u></a>  |  <a href="https://eternalfinance.net/"><u>Website</u></a>  |  <a href="https://the-stamp.com/2023/02/eternal-finance/"><u>Audit</u></a>`,
          parse_mode: 'HTML'
        }).catch((err) => {
          console.error('Error sending photo:', err);
        });
      })
      .catch((err) => {
        console.error('Error getting contract balance:', err);
      });
  } catch (err) {
    console.error('Error handling LotteryWinner event:', err);
  }
}

contract.on('NewDeposit', handleBuyEvent);

  