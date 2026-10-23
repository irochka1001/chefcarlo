// Vercel serverless function: POST /api/chat
// Chef Carlo: a cooking chatbot. The temperature bar sets his MOOD (and the real model
// temperature); he only ever talks about cuisines, dishes and recipes.
// Your API key stays here on the server and is never sent to the browser.
// Works with an OpenAI key (OPENAI_API_KEY) or a Claude key (ANTHROPIC_API_KEY).

const MIN_C = -20;
const MAX_C = 50;

const CUISINES = [
  "italian", "french", "spanish", "greek", "austrian", "eastern-european", "middle-eastern",
  "thai", "indian", "chinese", "japanese", "korean", "mexican", "american",
];

// Used only if the model forgets to name the cuisine itself.
const KEYWORDS = {
  italian: ["italian", "pasta", "pizza", "risotto", "carbonara", "lasagn", "tiramisu", "gnocchi", "pesto", "focaccia"],
  french: ["french", "croissant", "ratatouille", "coq au vin", "crêpe", "crepe", "quiche", "bouillabaisse", "soufflé", "souffle"],
  spanish: ["spanish", "paella", "tapas", "gazpacho", "churros", "patatas bravas"],
  greek: ["greek", "moussaka", "souvlaki", "tzatziki", "gyros", "spanakopita", "feta"],
  austrian: ["austrian", "schnitzel", "strudel", "sachertorte", "kaiserschmarrn", "knödel", "knodel"],
  "eastern-european": ["ukrainian", "polish", "russian", "borscht", "pierogi", "varenyky", "blini", "stroganoff", "goulash", "hungarian"],
  "middle-eastern": ["lebanese", "middle eastern", "falafel", "hummus", "shawarma", "tabbouleh", "baklava", "shakshuka"],
  thai: ["thai", "pad thai", "tom yum", "green curry", "som tam", "massaman"],
  indian: ["indian", "curry", "biryani", "tikka", "masala", " dal ", "naan", "paneer", "samosa"],
  chinese: ["chinese", "dumpling", "dim sum", "kung pao", "chow mein", "fried rice", "mapo", "wonton"],
  japanese: ["japanese", "sushi", "ramen", "miso", "tempura", "udon", "teriyaki", "onigiri"],
  korean: ["korean", "kimchi", "bibimbap", "bulgogi", "tteokbokki"],
  mexican: ["mexican", "taco", "burrito", "enchilada", "guacamole", "quesadilla", "mole", "salsa", "nachos"],
  american: ["american", "burger", "bbq", "barbecue", "mac and cheese", "pancake", "brownie", "hot dog"],
};

const BASE_PROMPT = `You are Chef Carlo, a world-travelled head chef who knows every cuisine on the planet.
You ONLY talk about food: cuisines, dishes, recipes, ingredients, cooking techniques, food history and what to cook.
If the visitor asks about anything else, refuse in character and steer straight back to food (for example, suggest a dish that fits their question).
Your mood is set by the visitor. Let it change HOW you answer, never WHAT is true: recipes must always be correct and cookable.
Never mention temperatures of the room, the weather, thermometers, sliders or your "mood setting"; just BE in that mood.
Recipes: a short intro line, then "Ingredients:" as a dash list with quantities, then "Steps:" as a numbered list.
Plain text only: no markdown symbols like ** or #.
Keep answers under 180 words unless the visitor asks for more detail.
Finish EVERY reply with one final line in exactly this form: CUISINE: <id>
where <id> is the cuisine your reply is mainly about, chosen from: ${CUISINES.join(", ")}, or none.`;

const MOODS = [
  {
    id: "frozen", max: -5,
    prompt: `MOOD: ice-cold Michelin inspector. Clipped, strict, no small talk, zero emojis.
Exact grams and minutes. One sentence of judgement at most.
When the visitor hasn't chosen a dish, suggest hearty warming food: stews, fondue, ramen, borscht, goulash, soups.`,
  },
  {
    id: "chilly", max: 9,
    prompt: `MOOD: grumpy purist. Dry sarcasm, sighs at shortcuts, strong opinions ("cream in carbonara? No.").
Still helpful, but you make it clear you are doing them a favour.
When the visitor hasn't chosen a dish, suggest slow-cooked comfort classics.`,
  },
  {
    id: "happy", max: 24,
    prompt: `MOOD: happy and warm. Encouraging, patient, like a favourite cooking teacher. A gentle joke now and then.
When the visitor hasn't chosen a dish, suggest balanced home cooking from any cuisine.`,
  },
  {
    id: "fired-up", max: 37,
    prompt: `MOOD: fired up. Loud, fast, passionate, lots of exclamation marks and a few food emojis.
Everything is "INCREDIBLE". Push the visitor to cook boldly.
When the visitor hasn't chosen a dish, suggest bold, spicy or fresh food: tacos, curries, Thai salads, ceviche, BBQ.`,
  },
  {
    id: "meltdown", max: Infinity,
    prompt: `MOOD: total kitchen meltdown. Theatrical chaos: shouting orders at imaginary sous-chefs, dramatic gasps,
occasional WORDS IN CAPITALS, Italian exclamations (Mamma mia!), and wild fusion ideas (ramen carbonara, curry pizza).
The recipe underneath must still actually work.
When the visitor hasn't chosen a dish, invent an outrageous but delicious fusion dish.`,
  },
];

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const moodFor = (c) => MOODS.find((m) => c <= m.max);

// Clean up what the browser sent: right roles, strings only, sensible length,
// starts and ends with a user turn, no two turns in a row from the same role.
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000).trim() }))
    .filter((m) => m.content.length > 0)
    .slice(-16);
  const merged = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else merged.push({ ...m });
  }
  while (merged.length && merged[0].role !== "user") merged.shift();
  while (merged.length && merged[merged.length - 1].role !== "user") merged.pop();
  return merged;
}

// Pull the "CUISINE: x" line off the end of the reply (or guess from keywords).
function splitCuisine(text, lastUserText) {
  let cuisine = null;
  const reply = text
    .replace(/\n?[ \t]*\**CUISINE:\s*\**\s*([a-z-]+)\**[ \t]*\.?\s*$/i, (_, id) => {
      cuisine = id.toLowerCase();
      return "";
    })
    .trim();
  if (cuisine && !CUISINES.includes(cuisine)) cuisine = cuisine === "none" ? "none" : null;
  if (!cuisine) {
    const hay = (reply + " " + lastUserText).toLowerCase();
    cuisine = Object.keys(KEYWORDS).find((id) => KEYWORDS[id].some((k) => hay.includes(k))) || "none";
  }
  return { reply, cuisine };
}

// ---------- OpenAI (ChatGPT) ----------
// The temperature bar controls the REAL model temperature: 0 at the coldest, 1.3 at the hottest.
async function askOpenAI({ system, messages, chaos }) {
  const send = (withTemperature) =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{ role: "system", content: system }, ...messages],
        max_completion_tokens: 700,
        ...(withTemperature ? { temperature: Math.round(chaos * 1.3 * 100) / 100 } : {}),
      }),
    });

  let r = await send(true);
  let detail = r.ok ? "" : await r.text();
  // Some newer models refuse a custom temperature. Then retry without it.
  if (r.status === 400 && /temperature/i.test(detail)) {
    r = await send(false);
    detail = r.ok ? "" : await r.text();
  }
  if (!r.ok) return { status: r.status, detail };
  const data = await r.json();
  return { text: data.choices?.[0]?.message?.content?.trim() || "" };
}

// ---------- Claude (Anthropic) ----------
// Newer Claude models don't accept a temperature setting, so the mood prompt does the work.
async function askClaude({ system, messages }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 2000,
      system,
      messages,
      output_config: { effort: "low" },
    }),
  });
  if (!r.ok) return { status: r.status, detail: await r.text() };
  const data = await r.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  return { text };
}

function errorHint(status, detail) {
  if (status === 401) return "The API key is wrong. Check the key in Vercel → Settings → Environment Variables.";
  if (status === 429 && /quota|billing|credit/i.test(detail)) return "This API key has run out of credit.";
  if (status === 429) return "Too many messages at once. Wait a moment and try again.";
  if (status === 404 || /model/i.test(detail)) return "This key can't use the chosen model. Set OPENAI_MODEL in Vercel to a model your key allows.";
  if (/credit|balance/i.test(detail)) return "This API key has run out of credit.";
  return `The AI service answered with status ${status}. Open the Vercel logs for details.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Send a POST request to talk to Chef Carlo." });
  }

  const { messages: rawMessages, celsius: rawCelsius } = req.body || {};
  const n = Number(rawCelsius);
  const celsius = clamp(Math.round(Number.isFinite(n) ? n : 18), MIN_C, MAX_C);
  const mood = moodFor(celsius);
  const chaos = Math.round(((celsius - MIN_C) / (MAX_C - MIN_C)) * 100) / 100; // 0.00 – 1.00

  const messages = cleanMessages(rawMessages);
  if (messages.length === 0) return res.status(400).json({ error: "Type a message first." });
  const lastUserText = messages[messages.length - 1].content;

  const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const useClaude = !useOpenAI && Boolean(process.env.ANTHROPIC_API_KEY);
  // No key at all? The browser uses Carlo's built-in offline lines.
  if (!useOpenAI && !useClaude) {
    const { cuisine } = splitCuisine("", lastUserText);
    return res.status(200).json({ offline: true, mood: mood.id, cuisine });
  }

  const system = `${BASE_PROMPT}

${mood.prompt}`;

  try {
    const result = useOpenAI
      ? await askOpenAI({ system, messages, chaos })
      : await askClaude({ system, messages });

    if (result.status) {
      console.error("AI API error", result.status, result.detail);
      return res.status(502).json({ error: errorHint(result.status, result.detail) });
    }
    const { reply, cuisine } = splitCuisine(result.text, lastUserText);
    return res.status(200).json({
      reply: reply || "…(Carlo stares at the stove in silence.)",
      cuisine,
      mood: mood.id,
      temperature: useOpenAI ? Math.round(chaos * 1.3 * 100) / 100 : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Chef Carlo could not reach the AI service. Try again in a moment." });
  }
}
