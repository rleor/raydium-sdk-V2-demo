import axios from 'axios'

// https://github.com/fabius8/binanceAlert/blob/main/binanceAlert.py#L67

const sleep = (time: number) => {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
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
    private interval: number
    constructor( interval: number, ) {
        this.interval = interval
        this.existingArticleIds = [];
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
        const articles = await this.getArticles();
        for (const article of articles) {
            if (!this.existingArticleIds.includes(article.id)) {
                console.log("found new: " + article.title);
                
                // do something

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
            sleep(this.interval * 1000);
        }
    }
}

const main = async () => {
    const monitor = new BinanceNewsMonitor(60);
    await monitor.init();
    await monitor.loop;
};

main();