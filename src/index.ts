import {program} from 'commander';
import fs from 'fs';
import { BinanceNewsMonitor } from './monitor/binance';
import winston from 'winston';
import internalconfig from './internalconfig.json';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'weagle-bot.log' }),
    ],
});

program
    .name('weagle-bot')
    .version('0.0.1');
program.option('-c, --config-file <filepath>', '', './config.json');
program.parse();
const options = program.opts();

const configFile = fs.readFileSync(options.configFile, 'utf-8');
const config = JSON.parse(configFile);

(async () => {
    const monitor = new BinanceNewsMonitor(
        logger,
        config.interval, 
        config.solEndpoint, 
        config.coins, 
        config.watch, 
        config.slippage,
        config.priorityFeeX,
        internalconfig.telegramToken,
    );
    if (!config.skipInit) {
        logger.info('skip init');
        await monitor.init();
    }
    await monitor.loop();
})();