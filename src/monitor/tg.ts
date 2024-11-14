import TelegramBot from 'node-telegram-bot-api';

export class Telegram {
    private bot: TelegramBot
    constructor(token?: string) {
        if (!token) {
            token = "7418588931:AAFnj6aID5lPtmBAIYUJGFDIz6tCMDygGLU";
        }

        this.bot = new TelegramBot(token);
    }
    public sendMessage(chatId: string, message: string) {
        this.bot.sendMessage(chatId, message);
    }
}