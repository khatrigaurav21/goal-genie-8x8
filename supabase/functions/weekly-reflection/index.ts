import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goal, completedTasks, challenges, nextWeekFocus, totalCompleted, totalTasks, language = "en" } = await req.json();

    const overLimit = [goal, completedTasks, challenges, nextWeekFocus].some(
      (v) => typeof v === "string" && v.length > 4000
    );
    if (overLimit) {
      return new Response(JSON.stringify({ error: "Input is too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            content: `You are an encouraging goal achievement coach providing a weekly reflection summary. Respond ENTIRELY in ${langName}. Use markdown with headers and bullet points. Be warm, specific, and actionable.`,
          },
          {
            role: "user",
            content: `Goal: "${goal}"
Progress: ${totalCompleted}/${totalTasks} tasks completed

Tasks completed this week:
${completedTasks || "None reported"}

Challenges faced:
${challenges || "None reported"}

Plans for next week:
${nextWeekFocus || "Not specified"}

Provide:
1. **Encouragement** - Celebrate progress and effort
2. **Pattern analysis** - What patterns do you see in their completed tasks?
3. **Suggestions** - 2-3 specific adjustments to their approach
4. **Next week focus** - Recommend which types of tasks to prioritize

Keep it concise, warm, and motivating.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate reflection" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ summary: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-reflection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
