# Chef Carlo 👨‍🍳

A cooking chatbot that only talks about cuisines, dishes and recipes.
The **temperature bar** sets Carlo's mood, which changes how he answers:

| Temperature | Mood | How he answers |
|---|---|---|
| −20 to −5° | Ice-cold Carlo | Strict Michelin inspector, exact grams, no small talk, hearty dishes |
| −4 to 9° | Grumpy Carlo | Sarcastic purist, sighs at shortcuts, slow-cooked classics |
| 10 to 24° | Happy Carlo | Warm, patient cooking teacher |
| 25 to 37° | Fired-up Carlo | Loud and fast, loves bold, spicy food |
| 38 to 50° | Meltdown Carlo | Kitchen chaos, wild (but working) fusion recipes |

The bar also sets the **real model temperature** (0 to 1.3) sent to OpenAI, so colder Carlo is
more predictable and hotter Carlo is more creative.

Carlo's face, colours and steam/sweat/icicles follow his mood. The dish he holds, his neckerchief
and hat band follow the cuisine of the conversation (14 cuisines). The AI tags each reply with its
cuisine, and the page updates the picture.

## Features

- **Cuisine kitchens:** colours, background pattern, header and greeting change with the cuisine.
- **Recipe cards:** time and difficulty, ingredients you can tick off, numbered steps, "Copy shopping list".
- **Servings adjuster:** 1, 2, 4 or 6 people; every quantity recalculates.
- **Diet switches:** vegetarian, vegan, gluten-free, dairy-free, no pork. Carlo must obey them.
- **Food passport:** a stamp for each of the 14 cuisines you visit (saved in your browser).

## Files

```
index.html     the page and Carlo's drawing
style.css      the five mood themes
app.js         temperature bar, chat, cuisine plate, offline replies
api/chat.js    server function that talks to the AI (keeps your key secret)
package.json   tells Vercel to use modern JavaScript
```

## Deploy

1. Put these files in a GitHub repository (keep `chat.js` inside the `api` folder).
2. On vercel.com: Add New → Project → import the repository → preset **Other**.
3. Environment Variables: `OPENAI_API_KEY` = your key (or `ANTHROPIC_API_KEY` for Claude).
4. Deploy. Every change on GitHub redeploys automatically.

Optional: `OPENAI_MODEL` (default `gpt-4.1-mini`).
