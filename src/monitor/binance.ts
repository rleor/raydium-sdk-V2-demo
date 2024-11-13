import axios from 'axios'
import watch from './watch.json';

// https://github.com/fabius8/binanceAlert/blob/main/binanceAlert.py#L67

const sleep = (time: number) => {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}

interface WatchedCoin {
    coin: string
    ca: string
}

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
    private existingArticleIds: number[]
    private existingCoin: string[]
    private interval: number
    private watchList: WatchedCoin[]
    constructor( interval: number, watch: WatchedCoin[]) {
        this.interval = interval
        this.existingArticleIds = [];
        this.existingCoin = [];
        this.watchList = watch;
        for (const w of watch) {
            console.log(`watching ${w.coin}`);
        }
    }

    private async getArticles(): Promise<Article[]> {
        const BINANCE_NEWS_URL = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20";
        const {data} = await axios.get<NewsResp>(BINANCE_NEWS_URL);
        if (data.code !== "000000") {
            throw new Error(`get binances new failed: ${data.code} ${data.message}`);
        }
        return data.data.catalogs[0].articles;
    }
    
    public async init() {
        const articles = await this.getArticles();
        for (const artical of articles) {
            if (!this.existingArticleIds.includes(artical.id)) {
                this.existingArticleIds.push(artical.id);
            }
        }
    }

    private async check() {
        console.log("checking...");
        const articles = await this.getArticles();
        for (const article of articles) {
            if (!this.existingArticleIds.includes(article.id)) {
                if (article.title.startsWith("Binance Will List") || article.title.startsWith("Binance Will Add")) {
                    for (const c of this.watchList) {
                        if (!this.existingCoin.includes(c.coin)) {
                            if (article.title.includes(`(${c.coin})`)) {
                                // notification and buy
                                console.log(`notification: new token ${c.coin} listed`);
                                console.log(article.title);

                                console.log(`buying ${c.coin}`);

                                this.existingCoin.push(c.coin);
                            }
                        } else {
                            console.log(`coin ${c.coin} is already handled.`);
                        }
                    }
                }

                this.existingArticleIds.push(article.id);
            }
        }
    }

    public async loop() {
        while(true) {
            try {
                await this.check();
            } catch (e) {
                console.log("check failed: ", e);
            }
            await sleep(this.interval * 1000);
        }
    }
}

const main = async () => {
    const monitor = new BinanceNewsMonitor(60, watch);
    await monitor.init();
    await monitor.loop();
};

main();