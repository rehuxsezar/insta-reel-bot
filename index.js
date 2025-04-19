require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { Insta } = require('insta-fetcher');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Telegram Bot Setup
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Insta Fetcher Setup (No login required for public posts)
const insta = new Insta();

// Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Bhai! Instagram Reel download karna hai? Bas mujhe Reel ka URL bhej de!');
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Commands:
    /start - Bot shuru karo
    /help - Yeh menu dekho
    Baki bas Instagram Reel ka URL bhejo, main video download karke bhej dunga!`);
});

// Handle Instagram URL
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore commands
    if (text.startsWith('/')) return;

    // Check if it's a valid Instagram URL
    if (text.includes('instagram.com/reel')) {
        try {
            bot.sendMessage(chatId, 'Thodi der ruk, main Reel download karta hu...');

            // Download Instagram Reel
            const data = await insta.fetchMedia(text);
            const videoUrl = data.url;

            // Download video to local
            const fileName = `reel_${Date.now()}.mp4`;
            const filePath = path.join(__dirname, fileName);
            const response = await axios({
                url: videoUrl,
                method: 'GET',
                responseType: 'stream',
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            // Wait for download to finish
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Send video to user
            await bot.sendVideo(chatId, filePath);

            // Clean up
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, 'Bhai, kuch gadbad ho gaya. Sahi URL bhej ya thodi der baad try kar.');
        }
    } else if (!text.startsWith('/')) {
        bot.sendMessage(chatId, 'Bhai, Instagram Reel ka URL bhej na!');
    }
});

console.log('Bot is running...');
