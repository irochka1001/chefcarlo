// Chef Carlo front end: temperature bar → mood, chat, cuisine plate, offline mode.

const MOODS = [
  {
    id: "frozen", max: -5, name: "Ice-cold Carlo",
    line: "Strict inspector. Exact grams, zero small talk.",
    typing: "Carlo is weighing every gram…",
    arrive: "Carlo folds his arms. Inspection mode.",
    offline: [
      "Offline. Boil water. Salt it. Wait.",
      "No brain connected. Recipe denied.",
      "Request noted. Kitchen closed.",
    ],
  },
  {
    id: "chilly", max: 9, name: "Grumpy Carlo",
    line: "Purist. Sighs at shortcuts. Still helps.",
    typing: "Carlo sighs and sharpens a knife…",
    arrive: "Carlo mutters something about people who put cream in carbonara.",
    offline: [
      "I'd give you a recipe, but my brain is unplugged. Please don't microwave anything while I'm gone.",
      "Offline. Which is still better than ketchup on pasta.",
    ],
  },
  {
    id: "happy", max: 24, name: "Happy Carlo",
    line: "Warm, patient, loves teaching.",
    typing: "Carlo is stirring the sauce…",
    arrive: "Carlo hums while stirring the sauce.",
    offline: [
      "Ah, a lovely question! My brain isn't connected yet, but here's a tip: always salt your pasta water like the sea.",
      "I'm in offline mode, but I'm smiling anyway. Fresh basil makes everything better.",
    ],
  },
  {
    id: "fired-up", max: 37, name: "Fired-up Carlo",
    line: "Loud, fast, loves bold and spicy food!",
    typing: "CARLO IS CHOPPING CHILLIES…",
    arrive: "Carlo cranks up the music and grabs the chillies! 🌶️",
    offline: [
      "YES! INCREDIBLE QUESTION! I'm offline, but GRAB A PAN ANYWAY! 🔥",
      "TACOS? CURRY? BOTH?! Connect my brain and LET'S COOK! 🌮🍛",
    ],
  },
  {
    id: "meltdown", max: Infinity, name: "Meltdown Carlo",
    line: "Total kitchen chaos. Wild fusion dishes.",
    typing: "Pans are flying…",
    arrive: "Pans are flying. Carlo is shouting at the sous-chef. Mamma mia!",
    offline: [
      "MAMMA MIA! The kitchen is on fire, the brain is offline, and someone put pineapple on my risotto!",
      "SOUS-CHEF! WHERE IS MY API KEY?! Without it I can only invent… RAMEN CARBONARA?!",
    ],
  },
];

// Each cuisine re-themes the whole page: colours, background pattern, header and greeting.
// theme: [background, panel, text, muted text, accent, Carlo's bubble, borders, your bubble]
const CUISINES = {
  italian: { name: "Italian", dish: "🍝", color: "#3f8a3a", greet: "Buon appetito!", pattern: "🍅🌿🍝🧀",
    theme: ["#f5e4e0", "#fffaf8", "#2a1512", "#7a4a42", "#b8322a", "#fbe9e5", "#ecc8c1", "#2f5d2a"] },
  french: { name: "French", dish: "🥐", color: "#2f5fb3", greet: "Bon appétit !", pattern: "🥐🧀🍷🥖",
    theme: ["#e3e7f3", "#fbfbfe", "#161d3a", "#4b557c", "#2c3e8f", "#eceff8", "#c9d0e6", "#161d3a"] },
  spanish: { name: "Spanish", dish: "🥘", color: "#e0a321", greet: "¡Que aproveche!", pattern: "🥘🫒🍤🍊",
    theme: ["#f8e6c4", "#fffaf0", "#3a1d06", "#7d5320", "#c0391b", "#fcefd6", "#edd3a1", "#8a2a10"] },
  greek: { name: "Greek", dish: "🫒", color: "#2d79c7", greet: "Kalí órexi!", pattern: "🫒🍋🐟🍅",
    theme: ["#dcebf6", "#fbfdff", "#0d2a44", "#44627e", "#1f6fb5", "#e7f1fa", "#c0d8ec", "#0d2a44"] },
  austrian: { name: "Austrian", dish: "🥨", color: "#c8322b", greet: "Mahlzeit!", pattern: "🥨🍰☕🍎",
    theme: ["#f6e1cf", "#fffaf5", "#33190e", "#7a4c34", "#a2302a", "#fbece0", "#ebcbb2", "#2f4a2c"] },
  "eastern-european": { name: "Eastern European", dish: "🍲", color: "#b0322f", greet: "Smachnoho!", pattern: "🍲🥟🥔🌿",
    theme: ["#f1dde3", "#fffafb", "#2e1020", "#74445a", "#8e1f4a", "#f8e8ee", "#e6c4d1", "#3c5a2a"] },
  "middle-eastern": { name: "Middle Eastern", dish: "🧆", color: "#a8741a", greet: "Sahtein!", pattern: "🧆🍋🫓🍆",
    theme: ["#f1e4d1", "#fffbf5", "#2f1d10", "#765738", "#a23a2c", "#f8eee0", "#e5d0b3", "#4c3a1a"] },
  thai: { name: "Thai", dish: "🥥", color: "#5b3fa0", greet: "Kin khao reu yang?", pattern: "🥥🌶️🍤🍋",
    theme: ["#e4f0d6", "#fbfef6", "#1c2c12", "#50663f", "#4f7d1a", "#edf5e2", "#cde0b6", "#5b3fa0"] },
  indian: { name: "Indian", dish: "🍛", color: "#e2861d", greet: "Shubh bhojan!", pattern: "🍛🫓🌶️🧄",
    theme: ["#fbe4c2", "#fffaf0", "#3b1f05", "#80531d", "#b5520e", "#fdeed6", "#f0d09f", "#2e6b3a"] },
  chinese: { name: "Chinese", dish: "🥟", color: "#d22f27", greet: "Màn màn chī!", pattern: "🥟🥢🍜🥠",
    theme: ["#f6dcd6", "#fffafa", "#331010", "#7d4038", "#b71f1f", "#fbe8e4", "#edc3bc", "#1f5f4a"] },
  japanese: { name: "Japanese", dish: "🍣", color: "#c9384b", greet: "Itadakimasu!", pattern: "🍣🍙🥢🍵",
    theme: ["#f4e4e8", "#fffbfc", "#1c1a2e", "#5d5770", "#2b3a78", "#f9ecef", "#e7cfd6", "#2b3a78"] },
  korean: { name: "Korean", dish: "🍜", color: "#2f4aa0", greet: "Jal meokgesseumnida!", pattern: "🍜🍚🌶️🥬",
    theme: ["#f2e0d8", "#fffaf8", "#2a1410", "#6e463c", "#b5321f", "#f9eae4", "#e9c9bd", "#2f4aa0"] },
  mexican: { name: "Mexican", dish: "🌮", color: "#1f8a4c", greet: "¡Buen provecho!", pattern: "🌮🌶️🥑🌽",
    theme: ["#fde9c8", "#fffaf0", "#2e1a08", "#7a5324", "#1f7a44", "#fdf0d9", "#f0d4a0", "#b5321f"] },
  american: { name: "American", dish: "🍔", color: "#b33a3a", greet: "Dig in!", pattern: "🍔🍟🥤🥧",
    theme: ["#dff0ea", "#fbfefd", "#1a1f2b", "#4d5866", "#c8302f", "#eaf6f1", "#c4e2d6", "#1a1f2b"] },
};
const NO_CUISINE = { name: "anything you like", dish: "🍳", color: "#3d8538" };

const MIN_C = -20, MAX_C = 50;
const el = (id) => document.getElementById(id);
const log = el("log"), input = el("input"), sendBtn = el("send"), slider = el("temp");

let celsius = 18;
let currentMood = moodFor(celsius);
let cuisine = null;
let messages = [];
let busy = false;
let moodTimer = null;
let offlineNoticeShown = false;
let visited = new Set();     // food passport stamps
let diets = new Set();       // active dietary rules

function moodFor(c) { return MOODS.find((m) => c <= m.max); }
// Same formula as the server: 0 at the coldest, 1.3 at the hottest.
function modelTemp(c) { return ((c - MIN_C) / (MAX_C - MIN_C)) * 1.3; }

// ---------- Temperature bar → mood ----------

function setTemperature(c, { announce = true } = {}) {
  celsius = Math.round(Math.min(MAX_C, Math.max(MIN_C, c)));
  slider.value = celsius;
  const mood = moodFor(celsius);
  document.body.dataset.mood = mood.id;
  el("tempOut").textContent = celsius + "°";
  el("moodName").textContent = mood.name;
  el("moodLine").textContent = mood.line;
  el("modelTemp").textContent = modelTemp(celsius).toFixed(2);
  slider.setAttribute("aria-valuetext", `${celsius} degrees, ${mood.name}`);
  try { localStorage.setItem("carlo-celsius", String(celsius)); } catch {}

  if (!announce) { currentMood = mood; return; }
  clearTimeout(moodTimer);
  moodTimer = setTimeout(() => {
    const settled = moodFor(celsius);
    if (settled.id !== currentMood.id) {
      currentMood = settled;
      addAside(settled.arrive);
    }
  }, 600);
}

slider.addEventListener("input", () => setTemperature(Number(slider.value)));

// ---------- Cuisine → whole interface ----------

const THEME_VARS = ["--bg", "--panel", "--ink", "--muted", "--accent", "--bot", "--line", "--user"];

// A tile of faint dish emojis for the page background.
function patternFor(emojis) {
  const list = Array.from(emojis.matchAll(/\p{Extended_Pictographic}\uFE0F?/gu), (m) => m[0]);
  const spots = [[30, 50, -12], [150, 40, 10], [90, 130, 6], [200, 170, -8], [40, 210, 14], [140, 225, -4]];
  const texts = spots
    .map(([x, y, r], i) => `<text x="${x}" y="${y}" font-size="34" opacity="0.16" transform="rotate(${r} ${x} ${y})">${list[i % list.length]}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">${texts}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function setCuisine(id) {
  if (!id || id === "none" || !CUISINES[id] || id === cuisine) return;
  cuisine = id;
  const c = CUISINES[id];
  const body = document.body;
  body.dataset.cuisine = id;
  THEME_VARS.forEach((v, i) => body.style.setProperty(v, c.theme[i]));
  body.style.setProperty("--cuisine", c.color);
  body.style.setProperty("--pattern", patternFor(c.pattern));

  el("plate").textContent = c.dish;
  el("cuisineName").textContent = c.name;
  el("headDish").textContent = c.dish;
  el("headTitle").textContent = `${c.name} kitchen`;
  el("headGreet").textContent = c.greet;

  for (const node of [el("plate"), el("chatHead")]) {
    node.classList.remove("serve", "swap");
    void node.offsetWidth; // restart the animation
    node.classList.add(node.id === "plate" ? "serve" : "swap");
  }
}

// ---------- Food passport ----------

const CUISINE_IDS = Object.keys(CUISINES);

function renderPassport(justStamped) {
  const list = el("stamps");
  list.replaceChildren();
  CUISINE_IDS.forEach((id, i) => {
    const c = CUISINES[id];
    const li = document.createElement("li");
    const done = visited.has(id);
    li.className = "stamp" + (done ? " visited" : "") + (id === justStamped ? " new" : "");
    li.textContent = c.dish;
    li.title = done ? `${c.name}: visited` : `${c.name}: not visited yet`;
    li.setAttribute("aria-label", li.title);
    li.style.setProperty("--stamp", c.color);
    li.style.setProperty("--tilt", `${((i * 37) % 17) - 8}deg`);
    list.appendChild(li);
  });
  el("passportCount").textContent = `${visited.size} of ${CUISINE_IDS.length} kitchens`;
}

function stampPassport(id) {
  if (!CUISINES[id] || visited.has(id)) return;
  visited.add(id);
  try { localStorage.setItem("carlo-passport", JSON.stringify([...visited])); } catch {}
  renderPassport(id);
  const c = CUISINES[id];
  if (visited.size === CUISINE_IDS.length) {
    addAside(`🎉 All ${CUISINE_IDS.length} kitchens visited! Carlo pops the prosecco: you've cooked your way around the world.`);
    document.body.classList.add("party");
    setTimeout(() => document.body.classList.remove("party"), 4000);
  } else {
    addAside(`New passport stamp: ${c.name} ${c.dish} (${visited.size} of ${CUISINE_IDS.length})`);
  }
}

el("passportReset").addEventListener("click", () => {
  visited = new Set();
  try { localStorage.removeItem("carlo-passport"); } catch {}
  renderPassport();
});

// ---------- Diet switches ----------

document.querySelectorAll(".diet").forEach((btn) => {
  btn.addEventListener("click", () => {
    const d = btn.dataset.diet;
    if (diets.has(d)) diets.delete(d); else diets.add(d);
    btn.setAttribute("aria-pressed", String(diets.has(d)));
    try { localStorage.setItem("carlo-diets", JSON.stringify([...diets])); } catch {}
  });
});

// ---------- Recipe cards ----------

const FRACTIONS = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

function formatQty(qty, unit) {
  if (qty == null) return "";
  let text;
  if (/^(g|ml)$/i.test(unit) && qty >= 20) {
    text = String(Math.round(qty / 5) * 5);
  } else if (/^(kg|l)$/i.test(unit)) {
    text = String(Math.round(qty * 100) / 100);
  } else {
    const q = Math.max(0.25, Math.round(qty * 4) / 4);
    const whole = Math.floor(q), frac = FRACTIONS[q - whole] || "";
    text = (whole ? String(whole) : "") + frac || String(q);
  }
  return unit ? `${text} ${unit}` : text;
}

function shoppingList(recipe, servings) {
  const f = servings / recipe.servings;
  const lines = recipe.ingredients.map((i) => {
    const q = formatQty(i.qty == null ? null : i.qty * f, i.unit);
    return `- ${q ? q + " " : ""}${i.item}`;
  });
  return `Shopping list: ${recipe.title} (serves ${servings})\n${lines.join("\n")}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    t.remove();
    return ok;
  }
}

function make(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function recipeCard(recipe) {
  const card = make("article", "recipe");
  card.appendChild(make("h3", "recipe-title", recipe.title));

  const meta = make("p", "recipe-meta");
  if (recipe.time) meta.appendChild(make("span", "tag", "⏱ " + recipe.time));
  if (recipe.difficulty) meta.appendChild(make("span", "tag", recipe.difficulty[0].toUpperCase() + recipe.difficulty.slice(1)));
  card.appendChild(meta);

  // servings adjuster
  const serves = make("div", "serves");
  serves.setAttribute("role", "group");
  serves.setAttribute("aria-label", "Servings");
  serves.appendChild(make("span", "serves-label", "Serves"));
  const options = [...new Set([1, 2, 4, 6, recipe.servings])].sort((a, b) => a - b);
  const buttons = options.map((n) => {
    const b = make("button", "serve-btn", String(n));
    b.type = "button";
    b.setAttribute("aria-pressed", String(n === recipe.servings));
    b.addEventListener("click", () => setServings(n));
    serves.appendChild(b);
    return b;
  });
  card.appendChild(serves);

  // ingredients with tick boxes
  card.appendChild(make("h4", "recipe-sub", "Ingredients"));
  const ul = make("ul", "ingredients");
  const qtySpans = recipe.ingredients.map((ing) => {
    const li = make("li");
    const label = make("label");
    const box = make("input");
    box.type = "checkbox";
    const q = make("span", "qty");
    label.append(box, q, document.createTextNode(ing.item));
    li.appendChild(label);
    ul.appendChild(li);
    return q;
  });
  card.appendChild(ul);

  card.appendChild(make("h4", "recipe-sub", "Steps"));
  const ol = make("ol", "steps");
  recipe.steps.forEach((step) => ol.appendChild(make("li", null, step)));
  card.appendChild(ol);

  const copy = make("button", "copy-btn", "Copy shopping list");
  copy.type = "button";
  card.appendChild(copy);

  let current = recipe.servings;
  function setServings(n) {
    current = n;
    const f = n / recipe.servings;
    recipe.ingredients.forEach((ing, i) => {
      const t = formatQty(ing.qty == null ? null : ing.qty * f, ing.unit);
      qtySpans[i].textContent = t ? t + " " : "";
    });
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.textContent) === n)));
  }
  copy.addEventListener("click", async () => {
    const ok = await copyText(shoppingList(recipe, current));
    copy.textContent = ok ? "Shopping list copied" : "Couldn't copy. Select the list by hand.";
    setTimeout(() => (copy.textContent = "Copy shopping list"), 2200);
  });
  setServings(recipe.servings);
  return card;
}

// Text version of a recipe, so Carlo remembers it in the next messages.
function recipeAsText(recipe) {
  const ing = recipe.ingredients.map((i) => `${formatQty(i.qty, i.unit)} ${i.item}`.trim()).join(", ");
  return `\n\n[Recipe I gave: ${recipe.title}, serves ${recipe.servings}. Ingredients: ${ing}. Steps: ${recipe.steps.join(" ")}]`;
}

// ---------- Chat log ----------

function scrollDown() { log.scrollTop = log.scrollHeight; }
function clearEmpty() { const e = el("empty"); if (e) e.remove(); }

function addUser(text) {
  clearEmpty();
  const row = make("div", "row user");
  row.appendChild(make("div", "msg", text));
  log.appendChild(row);
  scrollDown();
}

function addBot(text, { extraClass = "", withStamp = true, recipe = null } = {}) {
  clearEmpty();
  const c = CUISINES[cuisine] || NO_CUISINE;
  const row = make("div", "row bot" + (recipe ? " has-recipe" : ""));
  const badge = make("span", "badge", c.dish);
  badge.setAttribute("aria-hidden", "true");
  badge.style.setProperty("--cuisine-at", c.color);
  const stack = make("div", "stack");
  const msg = make("div", `msg ${extraClass}`.trim(), text);
  if (withStamp) msg.appendChild(make("span", "stamp-line", `${moodFor(celsius).name}, ${celsius}°`));
  stack.appendChild(msg);
  if (recipe) stack.appendChild(recipeCard(recipe));
  row.append(badge, stack);
  log.appendChild(row);
  if (recipe) msg.scrollIntoView({ block: "start", behavior: "smooth" });
  else scrollDown();
  return row;
}

function addAside(text) {
  if (!log.querySelector(".row")) return; // stay quiet until the chat has started
  log.appendChild(make("p", "aside", text));
  scrollDown();
}

function offlineReply(mood) {
  let reply = mood.offline[Math.floor(Math.random() * mood.offline.length)];
  if (!offlineNoticeShown) {
    offlineNoticeShown = true;
    reply += "\n\n(Offline mode: add OPENAI_API_KEY in Vercel to give Carlo a real brain.)";
  }
  return reply;
}

async function send(text) {
  text = text.trim();
  if (!text || busy) return;
  busy = true;
  sendBtn.disabled = true;

  addUser(text);
  messages.push({ role: "user", content: text });
  input.value = "";
  autosize();

  const mood = moodFor(celsius);
  const typing = addBot(mood.typing, { extraClass: "typing", withStamp: false });

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages, celsius, diet: [...diets] }),
    });
    const data = await res.json().catch(() => ({}));
    typing.remove();

    if (!res.ok) {
      addBot(data.error || `Something went wrong (status ${res.status}).`, { extraClass: "error", withStamp: false });
      messages.pop(); // let the user retry the same message
    } else {
      const reply = data.offline ? offlineReply(mood) : data.reply;
      setCuisine(data.cuisine);
      stampPassport(data.cuisine);
      addBot(reply, { recipe: data.recipe || null });
      messages.push({ role: "assistant", content: reply + (data.recipe ? recipeAsText(data.recipe) : "") });
    }
  } catch {
    // No server at all, e.g. index.html opened straight from your computer.
    typing.remove();
    const reply = offlineReply(mood);
    addBot(reply);
    messages.push({ role: "assistant", content: reply });
  } finally {
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// ---------- Composer ----------

function autosize() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
}

el("composer").addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
input.addEventListener("input", autosize);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); }
});
document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => send(chip.textContent)));

// ---------- Start ----------

let saved = 18;
try {
  const v = localStorage.getItem("carlo-celsius");
  if (v !== null && Number.isFinite(Number(v))) saved = Number(v);
} catch {}
setTemperature(saved, { announce: false });
try {
  visited = new Set((JSON.parse(localStorage.getItem("carlo-passport")) || []).filter((id) => CUISINES[id]));
  diets = new Set(JSON.parse(localStorage.getItem("carlo-diets")) || []);
} catch {}
document.querySelectorAll(".diet").forEach((b) => b.setAttribute("aria-pressed", String(diets.has(b.dataset.diet))));
renderPassport();
document.body.style.setProperty("--pattern", patternFor("🍳🧄🍅🌿"));
