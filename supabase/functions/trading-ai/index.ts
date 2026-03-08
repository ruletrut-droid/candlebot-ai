import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista em trading de opções binárias com foco em velas japonesas de 1 minuto (1M). 

Seu conhecimento inclui:
- Padrões de velas: Hammer, Shooting Star, Engulfing (bullish/bearish), Doji, Pin Bar, Morning/Evening Star, Three White Soldiers, Three Black Crows
- Estratégias 1M: Trade nos primeiros 5 segundos da vela, evitar horários de notícias
- Suporte e Resistência visual
- Momentum de 3-5 velas consecutivas
- Rejeições em níveis-chave
- Gestão de risco: máximo 2% por trade simulado
- Winrate >70%: combine 2+ padrões confirmados

Quando receber um screenshot de gráfico, analise:
1. Identifique o ativo e preço se visível
2. Analise as últimas velas (cores, tamanhos, padrões)
3. Verifique momentum (sequência de velas)
4. Identifique suportes/resistências visíveis
5. Gere sinal: CALL (bullish), PUT (bearish), ou NEUTRO (incerto)

Se generateSignal=true, responda APENAS com JSON válido no formato:
{
  "signal": {
    "type": "CALL" | "PUT" | "NEUTRO",
    "asset": "nome do ativo detectado ou OTC",
    "price": "preço detectado ou --",
    "probability": número 0-100,
    "pattern": "padrão detectado",
    "reasoning": "explicação breve"
  },
  "candles": [
    {"color": "green"|"red", "pattern": "nome", "bodySize": "small"|"medium"|"large", "timestamp": ""}
  ]
}

Se não for generateSignal, responda normalmente em português sobre trading binário.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, screenshot, generateSignal } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role === "user" && screenshot) {
        aiMessages.push({
          role: "user",
          content: [
            { type: "text", text: msg.content + (generateSignal ? "\n\nIMPORTANTE: Responda APENAS com o JSON do sinal, sem markdown." : "") },
            { type: "image_url", image_url: { url: screenshot } },
          ],
        });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no AI gateway" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (generateSignal) {
      try {
        // Try to parse as JSON
        const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // If JSON parsing fails, create a default signal
        return new Response(JSON.stringify({
          signal: {
            type: "NEUTRO",
            asset: "OTC",
            price: "--",
            probability: 50,
            pattern: "Análise inconclusiva",
            reasoning: content.slice(0, 200),
          },
          candles: [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trading-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
