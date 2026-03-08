import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/pages/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="pulse-dot" />
          <span className="font-mono text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
};

export default Index;
