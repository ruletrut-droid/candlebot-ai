import { TrendingUp, LogOut, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  userEmail: string;
  onSignOut: () => void;
}

export default function Navbar({ userEmail, onSignOut }: Props) {
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <span className="font-mono font-bold text-foreground">BinaryBot</span>
          <span className="text-xs text-muted-foreground font-mono">1M</span>
          <div className="hidden sm:flex items-center gap-1 ml-4 px-2 py-1 rounded bg-primary/5 border border-primary/20">
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-xs font-mono text-primary">SIMULAÇÃO</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">{userEmail}</span>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="h-8">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
