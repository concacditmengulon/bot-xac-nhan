// bot.js

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Thay thế bằng API token của bot và các ID nhóm của bạn
const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GROUP_IDS = [
    '@tnambipnhatnekkk',
    '@danhsaptaixiu001',
    '@ZR6CcJd5OKk0NWNl'
];

const bot = new TelegramBot(TOKEN, { polling: true });

// --- Lệnh /start ---
bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Kiểm tra xem người dùng đã là thành viên của các nhóm chưa
    const isMember = await checkUserMembership(userId);

    if (isMember) {
        bot.sendMessage(chatId, `Xin chào ${msg.from.first_name}! Chào mừng trở lại.\nBạn đã là thành viên của các nhóm. Bây giờ bạn có thể gửi mã MD5 để dự đoán Tài Xỉu.`);
    } else {
        const welcomeMessage = `Chào mừng ${msg.from.first_name}!\nĐể sử dụng bot, bạn phải tham gia các nhóm sau:\n- ${GROUP_IDS.join('\n- ')}\n\nSau khi tham gia, hãy bấm /start lại để xác nhận.`;
        bot.sendMessage(chatId, welcomeMessage);
    }
});

// --- Hàm kiểm tra thành viên của nhóm ---
async function checkUserMembership(userId) {
    try {
        // Lưu ý: TelegramBot API có hàm getChatMember, nhưng để đảm bảo các nhóm private
        // chúng ta có thể sử dụng một cách khác nếu cần.
        // Với các nhóm public, code này hoạt động tốt.
        for (const groupId of GROUP_IDS) {
            const member = await bot.getChatMember(groupId, userId);
            if (member && (member.status === 'member' || member.status === 'administrator' || member.status === 'creator')) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Lỗi khi kiểm tra thành viên:', error.message);
        return false;
    }
}

// --- Xử lý tin nhắn MD5 ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Bỏ qua các lệnh
    if (text.startsWith('/')) {
        return;
    }

    // Kiểm tra xác nhận trước khi xử lý MD5
    const isMember = await checkUserMembership(userId);
    if (!isMember) {
        return bot.sendMessage(chatId, 'Bạn chưa được xác nhận. Vui lòng tham gia các nhóm yêu cầu và bấm /start lại.');
    }

    const md5Regex = /^[0-9a-fA-F]{32}$/;

    if (md5Regex.test(text.trim())) {
        const md5Hash = text.trim();

        // Thuật toán dự đoán (ví dụ)
        const lastFour = md5Hash.substring(md5Hash.length - 4);
        let sumOfHex = 0;
        for (const char of lastFour) {
            sumOfHex += parseInt(char, 16);
        }

        const prediction = sumOfHex % 2 === 0 ? "Tài" : "Xỉu";
        const confidence = "90%"; // Bạn có thể tùy chỉnh độ tin cậy

        const replyMessage = `MD5: ${md5Hash}\nDự đoán: ${prediction}\nĐộ tin cậy: ${confidence}`;
        bot.sendMessage(chatId, replyMessage);
    } else {
        // Tránh spam
        if (text.length > 5 && !text.startsWith('/')) {
            bot.sendMessage(chatId, 'Mã MD5 không hợp lệ. Vui lòng gửi một chuỗi 32 ký tự MD5.');
        }
    }
});

console.log('Bot đang chạy...');

// --- Triển khai trên Render.com hoặc các dịch vụ tương tự (sử dụng webhooks) ---
// Đây là cách để bot không bị tắt. Bạn có thể bỏ qua phần này nếu chỉ chạy bot trên máy tính cá nhân.
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot đang hoạt động!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
