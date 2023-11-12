import { Telegraf } from 'telegraf';
import * as nodemailer from 'nodemailer';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const articleSet = new Set();
let currentDate = new Date();
let chatId = ''

bot.on('text', (ctx) => {
  chatId = ctx.message.chat.id;
  const articleRegex = new RegExp(process.env.ARTICLE_REGEX, 'g');
  const scanDate = process.env.SCAN_TODAY === 'true' ? new Date() : new Date(currentDate);
  scanDate.setDate(scanDate.getDate() - 1);

  if (ctx.message.date > Math.floor(scanDate.getTime() / 1000)) {
    const articles = [...new Set(ctx.message.text.match(articleRegex) || [])];

    articles.forEach((article) => {
      articleSet.add(article);
    });
  }
});

async function sendReport(articles, date, scanDateString) {
  const formattedDate = date.toISOString().slice(0, 10);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT, 
    secure: process.env.EMAIL_IS_SECURE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENTS.replace(/\s/g, ''),
      subject: `Отчет по артикулам за ${scanDateString}: ${formattedDate}`,
      text: `Отчет по артикулам за ${scanDateString}: ${formattedDate}\nАртикулы:\n${articles.join('\n')}`,
    };
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
    bot.telegram.sendMessage(chatId, `Отчет успешно отправлен за ${scanDateString}`);
  } catch (error) {
    console.error(error);
    bot.telegram.sendMessage(chatId, `Ошибка при отправке отчета: ${error.message}`);
  }
}

cron.schedule(process.env.SCHEDULE_TIME + ' * * *', async () => {
  const scanDateString = process.env.SCAN_TODAY === 'true' ? 'сегодня' : 'вчера';
  sendReport(Array.from(articleSet), currentDate, scanDateString);
  articleSet.clear();
});

bot.launch();

