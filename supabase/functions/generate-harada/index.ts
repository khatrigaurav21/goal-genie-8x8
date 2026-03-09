import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goal, language = "en" } = await req.json();
    if (!goal || typeof goal !== "string" || goal.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Goal is required" }), {
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

const systemPrompt = `You are an expert in the Harada Method (also known as the Mandala Chart or Open Window 64).
Given a user's ambitious goal, generate a complete Harada Method grid with:
- 8 supporting pillars (key areas/categories that support the main goal)
- 8 specific, actionable tasks for each pillar (64 tasks total)
- Identify the 10 highest-impact tasks across all pillars that would have the greatest effect on achieving the goal

Tasks should be concrete, measurable, and actionable. Each task should be a short phrase (3-8 words).

CRITICAL: You MUST respond ENTIRELY in ${langName}. All pillar names and all tasks must be in ${langName}. Do NOT use any other language.

You MUST respond using the provided tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `My goal: "${goal.trim()}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_harada_grid",
              description: "Create a complete Harada Method grid with 8 pillars and 64 tasks",
              parameters: {
                type: "object",
                properties: {
                  pillars: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Pillar name (2-4 words)" },
                        tasks: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 8,
                          maxItems: 8,
                          description: "8 specific actionable tasks for this pillar",
                        },
                      },
                      required: ["name", "tasks"],
                      additionalProperties: false,
                    },
                    minItems: 8,
                    maxItems: 8,
                  },
                  high_impact: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pillar_index: { type: "number", description: "Index of the pillar (0-7)" },
                        task_index: { type: "number", description: "Index of the task within the pillar (0-7)" },
                      },
                      required: ["pillar_index", "task_index"],
                      additionalProperties: false,
                    },
                    minItems: 10,
                    maxItems: 10,
                    description: "The 10 highest-impact tasks identified by pillar and task index",
                  },
                },
                required: ["pillars", "high_impact"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_harada_grid" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ goal: goal.trim(), pillars: args.pillars }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-harada error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
