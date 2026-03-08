export type SignalType = 'CALL' | 'PUT' | 'NEUTRO';

export interface TradingSignal {
  id: string;
  type: SignalType;
  asset: string;
  price: string;
  probability: number;
  pattern: string;
  reasoning: string;
  timestamp: Date;
}

export interface CandleData {
  color: 'green' | 'red';
  pattern: string;
  bodySize: 'small' | 'medium' | 'large';
  timestamp: string;
}

export interface TradeHistory {
  id: string;
  signal: SignalType;
  asset: string;
  price: string;
  probability: number;
  pattern: string;
  result?: 'WIN' | 'LOSS' | 'PENDING';
  timestamp: Date;
}
