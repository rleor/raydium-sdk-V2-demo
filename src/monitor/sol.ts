import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { apiSwap } from '../api/swap';
import bs58 from 'bs58'

export class Sol {
    private connection: Connection

    public constructor(endpoint: string) {
        if (endpoint === "") {
            endpoint = clusterApiUrl('mainnet-beta');
        }
        this.connection = new Connection(endpoint);
    }

    public async buy(key: string, tokenCA: string, solAmount: number): Promise<string> {
        const owner = Keypair.fromSecretKey(bs58.decode(key))
        const txId = await apiSwap(this.connection, owner, tokenCA, solAmount);
        return txId;
    }
}