import axios from 'axios'
import config from './config.json';
import winston from 'winston';
import {Sol} from './sol';
import {Telegram} from './tg';

// TODO: test binance api ban rate
// reference: https://github.com/fabius8/binanceAlert/blob/main/binanceAlert.py#L67

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

const sleep = (time: number) => {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}

// --------------- configurations
interface TokenInfo {
    symbol: string
    ca: string
    chain: string
}
interface Watch {
    pk: string
    tgId: string
    coins: WatchCoin[]
}
interface WatchCoin {
    symbol: string
    solAmount: number
}

//------------ binance response
interface NewsResp {
    code: string
    message: string
    data: NewsData
}
interface NewsData {
    catalogs: Array<Catalog>
}
interface Catalog {
    catalogId: number
    articles: Array<Article>
}
interface Article {
    id: number
    title: string
}
class BinanceNewsMonitor {
    private tokenInfos: TokenInfo[]
    private existingArticleIds: number[]
    private existingCoin: string[]
    private interval: number
    private watch: Watch[]
    private solApi: Sol
    private tgBot: Telegram

    constructor(
        interval: number, 
        solEndpoint: string,
        tokenInfo: TokenInfo[],
        watch: Watch[],
    ) {
        this.interval = interval
        this.existingArticleIds = [];
        this.existingCoin = [];
        this.tokenInfos = tokenInfo;
        this.watch = watch;
        this.solApi = new Sol(solEndpoint);
        this.tgBot = new Telegram();
    }

    // get latest news from binance api
    private async getArticles(): Promise<Article[]> {
        const BINANCE_NEWS_URL = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20";
        const {data} = await axios.get<NewsResp>(BINANCE_NEWS_URL);
        if (data.code !== "000000") {
            throw new Error(`get binances new failed: ${data.code} ${data.message}`);
        }
        return data.data.catalogs[0].articles;
    }
    
    // load old news
    public async init() {
        logger.info(`initializing current articles...`);
        const articles = await this.getArticles();
        for (const article of articles) {
            if (!this.existingArticleIds.includes(article.id)) {
                this.existingArticleIds.push(article.id);

                logger.info(`article ${article.id} loaded`);
            }
        }
    }

    private async check() {
        logger.info("checking...");

        const articles = await this.getArticles();
        for (const article of articles) {
            if (!this.existingArticleIds.includes(article.id)) {
                const titleUpper = article.title.toUpperCase();
                if (titleUpper.startsWith("BINANCE WILL LIST") || titleUpper.startsWith("BINANCE WILL ADD")) {
                    for (const tokenInfo of this.tokenInfos) { // exists in token infos
                        const tokenInfoUpper = tokenInfo.symbol.toUpperCase();
                        if (titleUpper.includes(`(${tokenInfoUpper})`)) { // exists in news
                            if (!this.existingCoin.includes(tokenInfoUpper)) { // hasn't processed
                                for (const user of this.watch) { // if user watches
                                    for (const wc of user.coins) {
                                        if (wc.symbol.toUpperCase() === tokenInfoUpper) {
                                            logger.info(`buying ${tokenInfoUpper} ${tokenInfo.ca} sol: ${wc.solAmount}sol`);
                                            try {
                                                const txId = await this.solApi.buy(user.pk, tokenInfo.ca, wc.solAmount);
                                                this.existingCoin.push(tokenInfo.symbol);

                                                try {
                                                    this.tgBot.sendMessage(user.tgId, `buy ${tokenInfoUpper} ${tokenInfo.ca} sol: ${wc.solAmount}sol tx: ${txId} success`);
                                                } catch (ee) {
                                                    // silent
                                                }
                                            } catch (e) {
                                                try {
                                                    this.tgBot.sendMessage(user.tgId, `failed to buy ${tokenInfoUpper} ${tokenInfo.ca} sol: ${wc.solAmount}sol ${e}`);
                                                } catch (ee) {
                                                    // silent
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                logger.info(`coin ${tokenInfoUpper} is already processed.`);
                            }
                        }
                    }
                }

                this.existingArticleIds.push(article.id);
            }
        }
    }

    public async loop() {
        while(true) {
            await this.check();
            await sleep(this.interval * 1000);
        }
    }
}

const main = async () => {
    logger.info(`loading config...`);
    logger.info(config);

    const monitor = new BinanceNewsMonitor(config.interval, config.solEndpoint, config.coins, config.watch);
    await monitor.init();
    await monitor.loop();
};

main();