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

const { RateLimiterMemory } = require('rate-limiter-flexible');

// Define the rate limiter options
const opts = {
  points: 1, // 1 point per request
  duration: 10, // 10 seconds
};
const rateLimiter = new RateLimiterMemory(opts);
const contract = new ethers.Contract(contractAddress, contractAbi, httpProvider);

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: { interval: 8000 } });
//const chatId = '@lotterytest001'
const chatId = '@eternalfinancebsc';


bot.on('polling_error', (err) => {
  console.error('Polling error:', err);
});

bot.onText(/price/, async (msg, match) => {
  try {
    const tokenAmount = '1000000000000000000';
    const busdAmount = await contract.tokenToBUSDToken(tokenAmount);
    const value = new Big(Number(busdAmount)).div(new Big('1e18')).toFixed(2);
    const userId = msg.from.id;
    const isAllowed = await rateLimiter.consume(userId);
    if (!isAllowed) {
      // If the user has exceeded the rate limit, send a message indicating that they need to wait
      bot.sendMessage(userId, 'You are sending requests too frequently. Please wait and try again later.');
      return;
    }

    console.log('BUSD amount:', busdAmount.toString());
    
    if (msg.chat.type === 'private') {
      // If the user sent the command in a private chat, respond in private
      await bot.sendMessage(msg.chat.id, `ETRNL Price is: ${value.toString()}$`);
    } else {
      // If the user sent the command in a group chat, respond in the same chat
      await bot.sendMessage(msg.chat.id, `ETRNL Price is: ${value.toString()}$`);
    }
  } catch (err) {
    const userId = msg.from.id;
    bot.sendMessage(userId, 'You are sending requests too frequently. Please wait and try again later.');
  }
});


async function handleBuyEvent(addr, amount) {
  try {
    console.log('Received event:', { addr , amount });
    const newamount = new Big(Number(amount)).div(new Big('1e18')).toFixed(2);
    const tokenAmount = '1000000000000000000';
    const busdAmount = await contract.tokenToBUSDToken(tokenAmount);
    const balance = await contract.getContractBalance();
    const bscScanLink = `https://bscscan.com/tx/${addr}`;
    const balance2 = new Big(Number(balance)).div(new Big('1e18')).toFixed(2);
    const busdAmount2 = new Big(Number(busdAmount)).div(new Big('1e18')).toFixed(2);
    // calculate number of emojis to send
    const numEmojis = Math.floor(newamount / 10);
    let emojis = '';
    for (let i = 0; i < numEmojis; i++) {
      emojis += '🚀'; // add rocket emoji
    }
    const caption = `💰 <b>New USDC deposit detected! 💰</b>\n\n ${emojis} \n\n<b>ETRNL Price:</b> ${busdAmount2}$\n<b>Total Balance:</b> ${balance2} USDC\n<b>Deposit Amount:</b> ${newamount} USDC\n\n  <a href="https://eternalfinance.net/"><u>Website</u></a>  |  <a href="https://the-stamp.com/2023/02/eternal-finance/"><u>Audit</u></a>`;
    await bot.sendPhoto(chatId, 'https://ipfs.filebase.io/ipfs/QmPV7UhZANN1auhab5UXMhVv2Aph1uDqgSkHR1e24YMJAJ', {
      caption: caption,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error('Error handling NewDeposit event:', err);
  }
}


contract.on('NewDeposit', handleBuyEvent);


  