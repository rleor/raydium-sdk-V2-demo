import TelegramBot from 'node-telegram-bot-api';

// https://api.telegram.org/bot7418588931:AAFnj6aID5lPtmBAIYUJGFDIz6tCMDygGLU/getUpdates
// 7418588931:AAFnj6aID5lPtmBAIYUJGFDIz6tCMDygGLU

export class Telegram {
    private bot: TelegramBot
    constructor(token: string) {
        this.bot = new TelegramBot(token);
    }
    public sendMessage(chatId: string, message: string) {
        this.bot.sendMessage(chatId, message);
    }
}