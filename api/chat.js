// Vercel serverless function: POST /api/chat
// Chef Carlo: a cooking chatbot. The temperature bar sets his MOOD (and the real model
// temperature); he only ever talks about cuisines, dishes and recipes.
// Replies come back as JSON so the page can draw recipe cards.
// Your API key stays here on the server and is never sent to the browser.
// Works with an OpenAI key (OPENAI_API_KEY) or a Claude key (ANTHROPIC_API_KEY).

const MIN_C = -20;
const MAX_C = 50;

const CUISINES = [
  "italian", "french", "spanish", "greek", "austrian", "eastern-european", "middle-eastern",
  "thai", "indian", "chinese", "japanese", "korean", "mexican", "american",
];

const DIETS = {
  vegetarian: "vegetarian (no meat, no fish, no seafood)",
  vegan: "vegan (no animal products at all: no meat, fish, eggs, dairy or honey)",
  "gluten-free": "gluten-free (no wheat, barley, rye or regular pasta/bread/soy sauce; suggest gluten-free swaps)",
  "no-pork": "no pork (no pork, bacon, guanciale, pancetta, ham or lard)",
  "dairy-free": "dairy-free (no milk, butter, cream or cheese)",
};

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

Always answer with ONE JSON object and nothing else, in exactly this shape:
{"message": string, "recipe": null or {"title": string, "servings": number, "time": string, "difficulty": "easy" | "medium" | "hard", "ingredients": [{"qty": number or null, "unit": string, "item": string}], "steps": [string]}, "cuisine": string}

Rules for the fields:
- "message": what you say, fully in your current mood. Plain text, no markdown. Under 120 words.
  If you give a recipe, keep "message" to 1-3 sentences of commentary and do NOT repeat the recipe in it.
- "recipe": include it whenever you give a cookable recipe, otherwise null.
  "qty" is a plain number for the given servings (null for "to taste"); "unit" is short, like g, ml, tbsp, tsp, cloves, pieces, or "".
  Write the "steps" in your current mood, but keep them accurate. 3 to 10 steps. Default to 2 servings.
- "cuisine": the cuisine your reply is mainly about, one of: ${CUISINES.join(", ")}, or "none".`;

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
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Clean up what the browser sent: right roles, strings only, sensible length,
// starts and ends with a user turn, no two turns in a row from the same role.
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2500).trim() }))
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

function guessCuisine(text) {
  const hay = " " + text.toLowerCase() + " ";
  return Object.keys(KEYWORDS).find((id) => KEYWORDS[id].some((k) => hay.includes(k))) || "none";
}

// Keep only well-formed recipe data, so a sloppy reply can't break the page.
function cleanRecipe(r) {
  if (!r || typeof r !== "object") return null;
  const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : [])
    .slice(0, 30)
    .map((i) => {
      if (typeof i === "string") return { qty: null, unit: "", item: str(i, 100) };
      const qty = Number(i && i.qty);
      return { qty: Number.isFinite(qty) && qty > 0 ? qty : null, unit: str(i && i.unit, 15), item: str(i && i.item, 100) };
    })
    .filter((i) => i.item);
  const steps = (Array.isArray(r.steps) ? r.steps : []).map((s) => str(s, 500)).filter(Boolean).slice(0, 15);
  const title = str(r.title, 100);
  if (!title || ingredients.length === 0 || steps.length === 0) return null;
  const servings = Math.round(Number(r.servings));
  return {
    title,
    servings: Number.isFinite(servings) ? clamp(servings, 1, 20) : 2,
    time: str(r.time, 30),
    difficulty: ["easy", "medium", "hard"].includes(r.difficulty) ? r.difficulty : "",
    ingredients,
    steps,
  };
}

// Turn the AI's answer into { reply, recipe, cuisine }, even if it didn't send clean JSON.
function parseAnswer(text, lastUserText) {
  let data = null;
  const raw = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try { data = JSON.parse(raw); } catch {
    const a = raw.indexOf("{"), b = raw.lastIndexOf("}");
    if (a !== -1 && b > a) { try { data = JSON.parse(raw.slice(a, b + 1)); } catch {} }
  }
  if (!data || typeof data !== "object") {
    // Plain text came back: show it as Carlo's message.
    const reply = raw.replace(/\n?\s*CUISINE:\s*[a-z-]+\s*$/i, "").trim();
    return { reply, recipe: null, cuisine: guessCuisine(reply + " " + lastUserText) };
  }
  const recipe = cleanRecipe(data.recipe);
  let cuisine = str(data.cuisine, 30).toLowerCase();
  if (!CUISINES.includes(cuisine)) {
    cuisine = guessCuisine([str(data.message, 2000), recipe ? recipe.title : "", lastUserText].join(" "));
  }
  return { reply: str(data.message, 2000), recipe, cuisine };
}

// ---------- OpenAI (ChatGPT) ----------
// The temperature bar controls the REAL model temperature: 0 at the coldest, 1.3 at the hottest.
async function askOpenAI({ system, messages, chaos }) {
  const opts = { temperature: true, json: true };
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{ role: "system", content: system }, ...messages],
        max_completion_tokens: 1400,
        ...(opts.temperature ? { temperature: Math.round(chaos * 1.3 * 100) / 100 } : {}),
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (r.ok) {
      const data = await r.json();
      return { text: data.choices?.[0]?.message?.content?.trim() || "" };
    }
    const detail = await r.text();
    // Some models refuse a custom temperature or JSON mode. Drop that setting and try again.
    if (r.status === 400 && opts.temperature && /temperature/i.test(detail)) { opts.temperature = false; continue; }
    if (r.status === 400 && opts.json && /response_format|json/i.test(detail)) { opts.json = false; continue; }
    return { status: r.status, detail };
  }
  return { status: 400, detail: "The model refused the request settings." };
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
      max_tokens: 3000,
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

  const { messages: rawMessages, celsius: rawCelsius, diet: rawDiet } = req.body || {};
  const n = Number(rawCelsius);
  const celsius = clamp(Math.round(Number.isFinite(n) ? n : 18), MIN_C, MAX_C);
  const mood = moodFor(celsius);
  const chaos = Math.round(((celsius - MIN_C) / (MAX_C - MIN_C)) * 100) / 100; // 0.00 – 1.00
  const diet = (Array.isArray(rawDiet) ? rawDiet : []).filter((d) => d in DIETS);

  const messages = cleanMessages(rawMessages);
  if (messages.length === 0) return res.status(400).json({ error: "Type a message first." });
  const lastUserText = messages[messages.length - 1].content;

  const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const useClaude = !useOpenAI && Boolean(process.env.ANTHROPIC_API_KEY);
  // No key at all? The browser uses Carlo's built-in offline lines.
  if (!useOpenAI && !useClaude) {
    return res.status(200).json({ offline: true, mood: mood.id, cuisine: guessCuisine(lastUserText) });
  }

  const dietRule = diet.length
    ? `\n\nThe visitor's dietary rules. Follow them in EVERY answer and recipe, no exceptions: ${diet.map((d) => DIETS[d]).join("; ")}.
React to these rules in your current mood when it fits, but never break them.`
    : "";
  const system = `${BASE_PROMPT}${dietRule}

${mood.prompt}`;

  try {
    const result = useOpenAI
      ? await askOpenAI({ system, messages, chaos })
      : await askClaude({ system, messages });

    if (result.status) {
      console.error("AI API error", result.status, result.detail);
      return res.status(502).json({ error: errorHint(result.status, result.detail) });
    }
    const { reply, recipe, cuisine } = parseAnswer(result.text, lastUserText);
    return res.status(200).json({
      reply: reply || (recipe ? "Here. Cook it properly." : "…(Carlo stares at the stove in silence.)"),
      recipe,
      cuisine,
      mood: mood.id,
      temperature: useOpenAI ? Math.round(chaos * 1.3 * 100) / 100 : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Chef Carlo could not reach the AI service. Try again in a moment." });
  }
}
