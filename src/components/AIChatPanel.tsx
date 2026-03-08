import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  screenshot: string | null;
}

export default function AIChatPanel({ screenshot }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou a **PRISMA IA**, sua assistente de trading binário 1M. Posso analisar padrões de velas, sugerir sinais e responder dúvidas sobre estratégias. Se a captura de tela estiver ativa, envie "analisar" para eu interpretar o gráfico atual.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setLoading(true);

    try {
      const hasScreenshot = screenshot && (input.toLowerCase().includes('analisar') || input.toLowerCase().includes('analise'));
      
      const response = await supabase.functions.invoke('trading-ai', {
        body: {
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          screenshot: hasScreenshot ? screenshot : undefined,
        },
      });

      if (response.error) throw response.error;
      
      const assistantContent = response.data?.response || 'Erro ao processar resposta.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${err.message || 'Falha na conexão'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-card p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">PRISMA IA Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[200px] max-h-[400px] scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={`rounded-2xl p-3 text-sm max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-primary/10 text-foreground' 
                : 'bg-secondary text-foreground'
            }`}>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-primary animate-pulse" />
            </div>
            <div className="bg-secondary rounded-2xl p-3">
              <span className="text-sm text-muted-foreground animate-pulse">Analisando...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Pergunte ou digite 'analisar'..."
          className="bg-secondary border-border text-sm rounded-xl"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading || !input.trim()} className="rounded-xl">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
