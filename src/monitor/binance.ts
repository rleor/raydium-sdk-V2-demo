import axios from 'axios'

// https://github.com/fabius8/binanceAlert/blob/main/binanceAlert.py#L67
const BINANCE_NEWS_URL = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20";
const interval = 60 // seconds

interface NewsResp {
    code: string
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

const start = async () => {
    const resp = await axios.get<NewsResp>(BINANCE_NEWS_URL);
    console.log(resp);
}

start();