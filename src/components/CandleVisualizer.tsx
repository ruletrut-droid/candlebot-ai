import { motion } from 'framer-motion';
import type { CandleData } from '@/types/trading';

interface Props {
  candles: CandleData[];
}

export default function CandleVisualizer({ candles }: Props) {
  return (
    <div className="terminal-card p-4">
      <h3 className="text-sm font-mono font-semibold text-foreground mb-3">Últimas Velas Detectadas</h3>
      
      {candles.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Nenhuma vela detectada. Inicie a captura de tela.
        </p>
      ) : (
        <div className="flex items-end gap-1 justify-center h-[100px]">
          {candles.map((candle, i) => {
            const heights = { small: 20, medium: 45, large: 70 };
            const h = heights[candle.bodySize];
            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-1"
                style={{ originY: 1 }}
              >
                <div
                  className={`w-3 rounded-sm ${candle.color === 'green' ? 'candle-green' : 'candle-red'}`}
                  style={{ height: `${h}px` }}
                />
                <span className="text-[8px] text-muted-foreground font-mono">
                  {candle.pattern.slice(0, 3)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
