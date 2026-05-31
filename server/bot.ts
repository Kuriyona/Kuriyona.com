import { Bot } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

const KURIYONA_ID = 7102464271;

bot.command('start', (ctx) => ctx.reply('Welcome!\n' + `Your user id is ${ctx.from?.id || 'N/A'}`));

bot.start();

export const push = (message: string) => bot.api.sendMessage(KURIYONA_ID, message, {});

export const isRunning = () => bot.isRunning();
