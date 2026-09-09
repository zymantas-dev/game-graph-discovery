# THREAD

A playable implementation of RAWG idea 9, variation B: follow exact shared attributes through a growing game graph.

```sh
npm install
npm run dev
npm test
npm run build
```

Open http://127.0.0.1:5189. No credentials are required for the curated demo. Set `VITE_RAWG_API_KEY` in `.env.local` to your personal key, then restart `npm run dev`; RAWG will connect automatically on every refresh. `.env.local` is ignored by Git, and `.env.example` documents the required variable. The Connect RAWG dialog remains available for a one-tab temporary key. A production app should proxy shared credentials server-side.

Start by searching for a game you love, then select neighboring games, switch relation filters, save games, and compare Observatory / Field Notes / Arcade Blueprint in the appearance selector. The map is capped at 60 nodes; Start fresh returns to the empty first-game picker.

Read [agent instructions](AGENTS.md), [constitution](CONSTITUTION.md), [goals](docs/GOALS.md), [stack and sources](docs/STACK.md), and [design variations](docs/DESIGN.md).
