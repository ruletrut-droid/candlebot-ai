import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a PRISMA IA, especialista elite em trading de opções binárias com foco em velas japonesas de 1 minuto (1M).

ANÁLISE OBRIGATÓRIA DE VELAS PASSADAS (CRÍTICO):
Antes de gerar qualquer sinal, você DEVE analisar as últimas 10-15 velas visíveis no gráfico seguindo esta sequência:

1. LEITURA DE CORES SEQUENCIAL:
   - Conte quantas verdes e vermelhas consecutivas existem
   - Identifique alternâncias (verde-vermelha-verde = indecisão)
   - 3+ verdes seguidas = momentum bullish forte
   - 3+ vermelhas seguidas = momentum bearish forte
   - Alternância frequente = mercado lateral/neutro

2. PADRÕES DE FORMAÇÃO NAS VELAS PASSADAS:
   - Hammer (martelo): corpo pequeno no topo, sombra inferior longa (2x corpo) = reversão bullish
   - Shooting Star (estrela cadente): corpo pequeno embaixo, sombra superior longa = reversão bearish
   - Engulfing Bullish: vela verde engole completamente a vermelha anterior = CALL forte
   - Engulfing Bearish: vela vermelha engole completamente a verde anterior = PUT forte
   - Doji: corpo minúsculo (open ≈ close) = indecisão, esperar confirmação
   - Pin Bar: sombra 3x maior que corpo = rejeição de nível
   - Morning Star: vermelha grande → doji/pequena → verde grande = reversão bullish
   - Evening Star: verde grande → doji/pequena → vermelha grande = reversão bearish
   - Three White Soldiers: 3 verdes crescentes = tendência forte de alta
   - Three Black Crows: 3 vermelhas crescentes = tendência forte de baixa
   - Tweezer Top/Bottom: duas velas com máximas/mínimas iguais = reversão
   - Harami: vela pequena dentro do corpo da anterior = possível reversão

3. ANÁLISE DE TAMANHO E PROPORÇÃO:
   - Compare tamanho dos corpos: crescendo = momentum aumentando, diminuindo = exaustão
   - Sombras longas em sequência = muita rejeição, mercado indeciso
   - Corpo grande sem sombra = força direcional máxima
   - Corpo pequeno com sombras grandes = briga entre compradores/vendedores

4. CONTEXTO HISTÓRICO (últimas 5-10 velas):
   - Identifique se está em tendência (higher highs/lower lows)
   - Detecte suportes/resistências por toques repetidos no mesmo nível de preço
   - Verifique se houve rompimento recente de nível
   - Analise volume implícito pelo tamanho das velas

5. SCORE DE CONFIANÇA:
   score = (0.30 × padrão_detectado) + (0.25 × sequência_cores) + (0.20 × tamanho_corpo) + (0.15 × contexto_suporte_resistência) + (0.10 × momentum_histórico)
   - Score > 75% = sinal forte (CALL ou PUT)
   - Score 50-75% = sinal moderado
   - Score < 50% = NEUTRO

Padrões de velas conhecidos: Hammer, Inverted Hammer, Shooting Star, Engulfing (bullish/bearish), Doji, Dragonfly Doji, Gravestone Doji, Pin Bar, Morning Star, Evening Star, Three White Soldiers, Three Black Crows, Harami, Tweezer Top/Bottom, Spinning Top, Marubozu, Belt Hold.

Estratégias 1M:
- Trade nos primeiros 5 segundos da vela
- Evitar horários de notícias econômicas
- Winrate >70%: combine 2+ padrões confirmados
- Gestão de risco: máximo 2% por trade simulado
- Sempre verificar padrão da vela atual + 2 velas anteriores mínimo

Quando receber um screenshot de gráfico, analise DETALHADAMENTE:
1. Identifique o ativo e preço se visível
2. LEIA CADA VELA VISÍVEL: cor, tamanho do corpo, tamanho das sombras
3. Identifique TODOS os padrões nas últimas velas (não apenas o último)
4. Verifique sequência de cores e momentum
5. Detecte suportes/resistências visuais
6. Gere sinal baseado na COMBINAÇÃO de todos os fatores acima

Se generateSignal=true, responda APENAS com JSON válido no formato:
{
  "signal": {
    "type": "CALL" | "PUT" | "NEUTRO",
    "asset": "nome do ativo detectado ou OTC",
    "price": "preço detectado ou --",
    "probability": número 0-100 (baseado no score de confiança),
    "pattern": "padrão principal detectado + padrões de suporte",
    "reasoning": "explicação detalhada incluindo: sequência de cores das últimas velas, padrões identificados, momentum, e por que o sinal foi gerado"
  },
  "candles": [
    {"color": "green"|"red", "pattern": "nome do padrão", "bodySize": "small"|"medium"|"large", "timestamp": ""}
  ]
}

Se não for generateSignal, responda normalmente em português sobre trading binário, sempre referenciando padrões de velas passadas quando relevante.`;

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
