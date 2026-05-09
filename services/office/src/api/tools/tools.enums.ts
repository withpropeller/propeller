export enum FxType {
    Buy = 'buy',
    Sell = 'sell',
}
export interface FxRate {
    hash: string;
    from: 'USD' | 'NGN';
    to: 'USD' | 'NGN';
    rate: number;
}
