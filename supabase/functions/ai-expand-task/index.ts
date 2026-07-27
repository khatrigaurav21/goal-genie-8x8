import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { task, goal, pillar, language = "en" } = await req.json();
    if (!task || !goal) {
      return new Response(JSON.stringify({ error: "Task and goal are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (String(task).length > 300 || String(goal).length > 300 || String(pillar || "").length > 200) {
      return new Response(JSON.stringify({ error: "Input is too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langNames: Record<string, string> = {
      en: "English", ja: "Japanese", es: "Spanish", fr: "French",
      de: "German", pt: "Portuguese", zh: "Chinese", ko: "Korean",
      ar: "Arabic", hi: "Hindi",
    };
    const langName = langNames[language] || "English";

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-flash-latest",
        messages: [
          {
            role: "system",
            content: `You are a goal achievement coach. Given a specific task from a Harada Method grid, provide a detailed, practical explanation of how to complete it. Respond ENTIRELY in ${langName}. Use markdown formatting with headers, bullet points, and bold text.`,
          },
          {
            role: "user",
            content: `Goal: "${goal}"
Pillar: "${pillar}"
Task: "${task}"

Provide:
1. **What this task means** - A short explanation of the task and why it matters for the goal
2. **Step-by-step guide** - 3-5 practical steps to complete this task
3. **Useful tools & resources** - Specific tools, websites, or resources that can help
4. **Common mistakes to avoid** - 2-3 pitfalls people commonly encounter

Keep it concise but actionable.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI quota exceeded." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate explanation" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ explanation: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-expand-task error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
