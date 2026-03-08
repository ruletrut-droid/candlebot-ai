import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { TradingSignal } from '@/types/trading';

interface Props {
  signal: TradingSignal | null;
}

export default function SignalDisplay({ signal }: Props) {
  if (!signal) {
    return (
      <div className="terminal-card p-6 flex flex-col items-center justify-center min-h-[200px]">
        <MinusCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">Aguardando sinal...</p>
        <p className="text-muted-foreground/50 text-xs mt-1">Inicie o monitoramento</p>
      </div>
    );
  }

  const config = {
    CALL: {
      icon: ArrowUpCircle,
      containerClass: 'signal-call glow-green',
      label: 'CALL',
      color: 'text-call',
    },
    PUT: {
      icon: ArrowDownCircle,
      containerClass: 'signal-put glow-red',
      label: 'PUT',
      color: 'text-destructive',
    },
    NEUTRO: {
      icon: MinusCircle,
      containerClass: 'signal-neutral',
      label: 'NEUTRO',
      color: 'text-neutral',
    },
  };

  const c = config[signal.type];
  const Icon = c.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signal.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`terminal-card border p-6 ${c.containerClass}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className={`w-10 h-10 ${c.color}`} />
            <div>
              <h2 className={`text-3xl font-extrabold ${c.color}`}>{c.label}</h2>
              <p className="text-sm text-muted-foreground">{signal.asset} • {signal.price}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-extrabold font-mono ${c.color}`}>{signal.probability}%</p>
            <p className="text-xs text-muted-foreground">probabilidade</p>
          </div>
        </div>
        <div className="bg-background/50 rounded-xl p-3">
          <p className="text-xs font-mono text-muted-foreground mb-1">Padrão: {signal.pattern}</p>
          <p className="text-xs text-muted-foreground">{signal.reasoning}</p>
        </div>
        <p className="text-xs text-muted-foreground/50 mt-2 font-mono">
          {signal.timestamp.toLocaleTimeString()}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
