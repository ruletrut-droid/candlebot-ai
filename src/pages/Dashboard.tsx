import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useScreenCapture } from '@/hooks/useScreenCapture';
import Navbar from '@/components/Navbar';
import SignalDisplay from '@/components/SignalDisplay';
import ScreenCapturePanel from '@/components/ScreenCapturePanel';
import TradeHistoryTable from '@/components/TradeHistoryTable';
import AIChatPanel from '@/components/AIChatPanel';
import CandleVisualizer from '@/components/CandleVisualizer';
import type { TradingSignal, TradeHistory, CandleData } from '@/types/trading';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { isCapturing, screenshot, error, startCapture, stopCapture, captureFrame } = useScreenCapture();
  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeScreenshot = useCallback(async () => {
    if (!screenshot || analyzing) return;
    setAnalyzing(true);
    
    try {
      const response = await supabase.functions.invoke('trading-ai', {
        body: {
          messages: [{ role: 'user', content: 'Analise este gráfico de velas 1M e gere um sinal de trading binário.' }],
          screenshot,
          generateSignal: true,
        },
      });

      if (response.data?.signal) {
        const signal: TradingSignal = {
          id: crypto.randomUUID(),
          type: response.data.signal.type,
          asset: response.data.signal.asset || 'OTC',
          price: response.data.signal.price || '--',
          probability: response.data.signal.probability || 50,
          pattern: response.data.signal.pattern || 'Análise visual',
          reasoning: response.data.signal.reasoning || '',
          timestamp: new Date(),
        };
        setCurrentSignal(signal);
        setTradeHistory(prev => [{
          id: signal.id,
          signal: signal.type,
          asset: signal.asset,
          price: signal.price,
          probability: signal.probability,
          pattern: signal.pattern,
          timestamp: signal.timestamp,
        }, ...prev].slice(0, 50));
      }
      if (response.data?.candles) {
        setCandles(response.data.candles);
      }
    } catch (err) {
      console.error('Erro na análise:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [screenshot, analyzing]);

  const handleStartCapture = useCallback(async () => {
    await startCapture(10000);
  }, [startCapture]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user?.email || ''} onSignOut={signOut} />
      
      <main className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <SignalDisplay signal={currentSignal} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CandleVisualizer candles={candles} />
            {isCapturing && (
              <button
                onClick={analyzeScreenshot}
                disabled={analyzing || !screenshot}
                className="w-full mt-2 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {analyzing ? 'Analisando...' : '🔍 Analisar Gráfico Agora'}
              </button>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ScreenCapturePanel
              isCapturing={isCapturing}
              screenshot={screenshot}
              onStart={handleStartCapture}
              onStop={stopCapture}
              onCapture={captureFrame}
              error={error}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AIChatPanel screenshot={screenshot} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TradeHistoryTable trades={tradeHistory} />
        </motion.div>
      </main>
    </div>
  );
}
