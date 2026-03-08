import { Monitor, MonitorOff, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isCapturing: boolean;
  screenshot: string | null;
  onStart: () => void;
  onStop: () => void;
  onCapture: () => void;
  error: string | null;
}

export default function ScreenCapturePanel({ isCapturing, screenshot, onStart, onStop, onCapture, error }: Props) {
  return (
    <div className="terminal-card p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Captura de Tela</h3>
          {isCapturing && <span className="pulse-dot" />}
        </div>
        <div className="flex gap-2">
          {isCapturing && (
            <Button size="sm" variant="outline" onClick={onCapture} className="h-7 text-xs rounded-full">
              <Camera className="w-3 h-3 mr-1" /> Capturar
            </Button>
          )}
          <Button
            size="sm"
            variant={isCapturing ? "destructive" : "default"}
            onClick={isCapturing ? onStop : onStart}
            className="h-7 text-xs rounded-full"
          >
            {isCapturing ? (
              <><MonitorOff className="w-3 h-3 mr-1" /> Parar</>
            ) : (
              <><Monitor className="w-3 h-3 mr-1" /> Iniciar</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-xs mb-2">{error}</p>
      )}

      <div className="flex-1 bg-secondary rounded-2xl overflow-hidden flex items-center justify-center min-h-[200px]">
        {screenshot ? (
          <img src={screenshot} alt="Captura da tela" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center p-4">
            <Monitor className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Clique "Iniciar" para compartilhar a tela da corretora
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Capturas automáticas a cada 10s
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
