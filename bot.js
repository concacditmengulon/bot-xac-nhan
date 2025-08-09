const { Telegraf, Markup } = require('telegraf');
const crypto = require('crypto');

// Token bot Telegram
const BOT_TOKEN = '8326780116:AAGF1HEe4lpvUexiDvUNmY1vKWqW2ARBcK0';

// Danh sách nhóm cần tham gia
const REQUIRED_GROUPS = [
  '@vannhatshare',
  '@tapdoanvannhat_itachi'
];

const bot = new Telegraf(BOT_TOKEN);

// Hàm kiểm tra thành viên
async function isMemberOfGroup(ctx, groupRef, userId) {
  try {
    const res = await ctx.telegram.getChatMember(groupRef, userId);
    return ['creator', 'administrator', 'member', 'restricted'].includes(res.status);
  } catch {
    return false;
  }
}

// Lệnh /start
bot.start((ctx) => {
  const welcome = `Chào ${ctx.from.first_name || ctx.from.username || 'bạn'}!\n
Bạn cần tham gia đủ các nhóm sau để dùng tool phân tích MD5:\n${REQUIRED_GROUPS.join('\n')}\n\nBấm "Xác nhận" để kiểm tra.`;
  ctx.reply(welcome, Markup.inlineKeyboard([
    Markup.button.callback('✅ Xác nhận', 'CHECK_MEMBERSHIP')
  ]));
});

// Xử lý nút Xác nhận
bot.action('CHECK_MEMBERSHIP', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const notMember = [];

  for (const g of REQUIRED_GROUPS) {
    const isMember = await isMemberOfGroup(ctx, g, userId);
    if (!isMember) notMember.push(g);
  }

  if (notMember.length > 0) {
    let text = '❌ Bạn chưa vào đủ các nhóm:\n';
    notMember.forEach(g => text += `• ${g}\n`);
    text += '\nVui lòng tham gia rồi bấm lại "Xác nhận".';
    return ctx.reply(text);
  }

  ctx.reply('✅ Bạn đã vào đủ nhóm. Gõ /help để xem cách dùng tool.');
});

// Lệnh /help
bot.command('help', (ctx) => {
  ctx.reply(`
Cách dùng tool:
- /analyze <md5> [mode]
  mode = deterministic | random (mặc định deterministic)
Ví dụ:
  /analyze d41d8cd98f00b204e9800998ecf8427e
`);
});

// Lệnh /analyze
bot.command('analyze', async (ctx) => {
  const userId = ctx.from.id;
  for (const g of REQUIRED_GROUPS) {
    const isMember = await isMemberOfGroup(ctx, g, userId);
    if (!isMember) {
      return ctx.reply(`❌ Bạn không còn là thành viên của ${g}.`);
    }
  }

  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 2) return ctx.reply('Vui lòng gửi MD5: /analyze <md5> [mode]');
  const md5 = parts[1].toLowerCase();
  const mode = (parts[2] || 'deterministic').toLowerCase();

  if (!/^[0-9a-f]{32}$/.test(md5)) {
    return ctx.reply('❌ MD5 không hợp lệ.');
  }

  let result;
  if (mode === 'random') {
    result = (Math.random() < 0.5) ? 'TÀI' : 'XỈU';
  } else {
    const buf = Buffer.from(md5, 'hex');
    let sum = 0;
    for (const b of buf) sum += b;
    result = (sum % 2 === 0) ? 'XỈU' : 'TÀI';
  }

  ctx.reply(`🔍 MD5: ${md5}\n➡️ Dự đoán: ${result}`);
});

// Chạy bot
bot.launch().then(() => {
  console.log('Bot đã chạy.');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
