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

const CUISINES = {
  italian:            { name: "Italian",          dish: "🍝", color: "#3f8a3a" },
  french:             { name: "French",           dish: "🥐", color: "#2f5fb3" },
  spanish:            { name: "Spanish",          dish: "🥘", color: "#e0a321" },
  greek:              { name: "Greek",            dish: "🫒", color: "#2d79c7" },
  austrian:           { name: "Austrian",         dish: "🥨", color: "#c8322b" },
  "eastern-european": { name: "Eastern European", dish: "🍲", color: "#b0322f" },
  "middle-eastern":   { name: "Middle Eastern",   dish: "🧆", color: "#a8741a" },
  thai:               { name: "Thai",             dish: "🥥", color: "#5b3fa0" },
  indian:             { name: "Indian",           dish: "🍛", color: "#e2861d" },
  chinese:            { name: "Chinese",          dish: "🥟", color: "#d22f27" },
  japanese:           { name: "Japanese",         dish: "🍣", color: "#c9384b" },
  korean:             { name: "Korean",           dish: "🍜", color: "#2f4aa0" },
  mexican:            { name: "Mexican",          dish: "🌮", color: "#1f8a4c" },
  american:           { name: "American",         dish: "🍔", color: "#b33a3a" },
};
const NO_CUISINE = { name: "anything you like", dish: "🍳", color: "#d8d8d8" };

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

// ---------- Cuisine → plate, scarf and hat band ----------

function setCuisine(id) {
  if (!id || id === "none" || !CUISINES[id]) return;
  const changed = id !== cuisine;
  cuisine = id;
  const c = CUISINES[id];
  document.body.style.setProperty("--cuisine", c.color);
  el("plate").textContent = c.dish;
  el("cuisineName").textContent = c.name;
  if (changed) {
    const plate = el("plate");
    plate.classList.remove("serve");
    void plate.offsetWidth; // restart the animation
    plate.classList.add("serve");
  }
}

// ---------- Chat log ----------

function scrollDown() { log.scrollTop = log.scrollHeight; }
function clearEmpty() { const e = el("empty"); if (e) e.remove(); }

function addUser(text) {
  clearEmpty();
  const row = document.createElement("div");
  row.className = "row user";
  const msg = document.createElement("div");
  msg.className = "msg";
  msg.textContent = text;
  row.appendChild(msg);
  log.appendChild(row);
  scrollDown();
}

function addBot(text, { extraClass = "", withStamp = true } = {}) {
  clearEmpty();
  const c = CUISINES[cuisine] || NO_CUISINE;
  const row = document.createElement("div");
  row.className = "row bot";
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.setAttribute("aria-hidden", "true");
  badge.textContent = c.dish;
  badge.style.setProperty("--cuisine-at", c.color);
  const msg = document.createElement("div");
  msg.className = `msg ${extraClass}`.trim();
  msg.textContent = text;
  if (withStamp) {
    const stamp = document.createElement("span");
    stamp.className = "stamp";
    stamp.textContent = `${moodFor(celsius).name}, ${celsius}°`;
    msg.appendChild(stamp);
  }
  row.append(badge, msg);
  log.appendChild(row);
  scrollDown();
  return row;
}

function addAside(text) {
  if (!log.querySelector(".row")) return; // stay quiet until the chat has started
  const p = document.createElement("p");
  p.className = "aside";
  p.textContent = text;
  log.appendChild(p);
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
      body: JSON.stringify({ messages, celsius }),
    });
    const data = await res.json().catch(() => ({}));
    typing.remove();

    if (!res.ok) {
      addBot(data.error || `Something went wrong (status ${res.status}).`, { extraClass: "error", withStamp: false });
      messages.pop(); // let the user retry the same message
    } else {
      setCuisine(data.cuisine);
      const reply = data.offline ? offlineReply(mood) : data.reply;
      addBot(reply);
      messages.push({ role: "assistant", content: reply });
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
