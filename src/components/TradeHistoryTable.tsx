import type { TradeHistory } from '@/types/trading';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

interface Props {
  trades: TradeHistory[];
}

export default function TradeHistoryTable({ trades }: Props) {
  const icons = {
    CALL: <ArrowUpCircle className="w-4 h-4 text-primary" />,
    PUT: <ArrowDownCircle className="w-4 h-4 text-destructive" />,
    NEUTRO: <MinusCircle className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <div className="terminal-card p-4">
      <h3 className="text-sm font-mono font-semibold text-foreground mb-3">Histórico de Sinais</h3>
      <div className="overflow-auto max-h-[300px] scrollbar-thin">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 px-2">Hora</th>
              <th className="text-left py-2 px-2">Sinal</th>
              <th className="text-left py-2 px-2">Ativo</th>
              <th className="text-right py-2 px-2">Preço</th>
              <th className="text-right py-2 px-2">Prob.</th>
              <th className="text-left py-2 px-2">Padrão</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum sinal registrado
                </td>
              </tr>
            ) : (
              trades.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="py-2 px-2 text-muted-foreground">
                    {t.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-2">
                    <span className="flex items-center gap-1">
                      {icons[t.signal]} {t.signal}
                    </span>
                  </td>
                  <td className="py-2 px-2">{t.asset}</td>
                  <td className="py-2 px-2 text-right">{t.price}</td>
                  <td className="py-2 px-2 text-right">{t.probability}%</td>
                  <td className="py-2 px-2 text-muted-foreground">{t.pattern}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
