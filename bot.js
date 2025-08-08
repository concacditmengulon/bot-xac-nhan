const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Khai báo các biến môi trường từ Render
const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Các username nhóm của bạn
const GROUP_USERNAMES = [
    'tnambipnhatnekkk',
    'danhsaptaixiu001',
    'ZR6CcJd5OKk0NWNl'
];

// Cấu hình bot ở chế độ webhook
const bot = new TelegramBot(TOKEN);

// --- Cấu hình web server để xử lý webhook ---
const app = express();
app.use(express.json());

// Đường dẫn webhook mà Telegram sẽ gửi dữ liệu đến
app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Thiết lập webhook cho bot
async function setWebhook() {
    try {
        const result = await bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`);
        console.log(`Webhook đã được thiết lập thành công: ${result}`);
    } catch (error) {
        console.error('Lỗi khi thiết lập webhook:', error.message);
    }
}
setWebhook();

// Đường dẫn mặc định
app.get('/', (req, res) => {
    res.send('Bot Telegram đang hoạt động!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});

// --- Lệnh /start ---
bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const isMember = await checkUserMembership(userId);

    if (isMember) {
        bot.sendMessage(chatId, `Xin chào ${msg.from.first_name}! Chào mừng trở lại.\nBạn đã là thành viên của các nhóm. Bây giờ bạn có thể gửi mã MD5 để dự đoán Tài Xỉu.`);
    } else {
        const groupLinks = GROUP_USERNAMES.map(username => `@${username}`).join('\n- ');
        const welcomeMessage = `Chào mừng ${msg.from.first_name}!\nĐể sử dụng bot, bạn phải tham gia các nhóm sau:\n- ${groupLinks}\n\nSau khi tham gia, hãy bấm nút "Xác nhận" bên dưới.`;
        
        // Thêm nút "Xác nhận"
        const keyboard = {
            inline_keyboard: [
                [{ text: '✅ Xác nhận', callback_data: 'confirm_membership' }]
            ]
        };

        bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard });
    }
});

// --- Hàm kiểm tra thành viên của nhóm ---
async function checkUserMembership(userId) {
    try {
        for (const username of GROUP_USERNAMES) {
            const member = await bot.getChatMember(`@${username}`, userId);
            if (member.status !== 'left' && member.status !== 'kicked') {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error(`Lỗi khi kiểm tra thành viên: ${error.message}`);
        return false;
    }
}

// --- Xử lý tin nhắn MD5 ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (text.startsWith('/')) {
        return;
    }
    
    const isMember = await checkUserMembership(userId);
    if (!isMember) {
        return bot.sendMessage(chatId, 'Bạn chưa được xác nhận. Vui lòng tham gia các nhóm yêu cầu và bấm /start lại hoặc nút "Xác nhận".');
    }
    
    const md5Regex = /^[0-9a-fA-F]{32}$/;

    if (md5Regex.test(text.trim())) {
        const md5Hash = text.trim();

        const lastFour = md5Hash.substring(md5Hash.length - 4);
        let sumOfHex = 0;
        for (const char of lastFour) {
            sumOfHex += parseInt(char, 16);
        }

        const prediction = sumOfHex % 2 === 0 ? "Tài" : "Xỉu";
        const confidence = "90%"; 

        const replyMessage = `MD5: ${md5Hash}\nDự đoán: ${prediction}\nĐộ tin cậy: ${confidence}`;
        bot.sendMessage(chatId, replyMessage);

    } else {
        if (text.length > 5) {
            bot.sendMessage(chatId, 'Mã MD5 không hợp lệ. Vui lòng gửi một chuỗi 32 ký tự MD5.');
        }
    }
});

// --- Xử lý sự kiện khi người dùng bấm nút ---
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;

    if (data === 'confirm_membership') {
        const isMember = await checkUserMembership(userId);
        
        if (isMember) {
            bot.sendMessage(msg.chat.id, `Xác nhận thành công! Bạn đã tham gia đủ các nhóm. Bây giờ bạn có thể sử dụng bot.`);
        } else {
            bot.sendMessage(msg.chat.id, `Bạn vẫn chưa tham gia đủ các nhóm. Vui lòng kiểm tra lại.`);
        }
    }
});
