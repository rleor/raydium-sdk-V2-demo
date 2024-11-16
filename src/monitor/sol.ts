import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { apiSwap } from '../api/swap';
import bs58 from 'bs58'

export class Sol {
    private connection: Connection

    public constructor(endpoint: string) {
        if (endpoint === "") {
            endpoint = clusterApiUrl('mainnet-beta');
        }
        console.log(endpoint);
        this.connection = new Connection(endpoint);
    }

    public async buy(key: string, tokenCA: string, solAmount: number, priorityFeeX: number = 1, slippage?: number): Promise<string> {
        const owner = Keypair.fromSecretKey(bs58.decode(key))
        const txId = await apiSwap(this.connection, owner, tokenCA, solAmount * 1000000000, priorityFeeX, slippage);
        return txId;
    }
}