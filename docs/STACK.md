# Stack and data architecture

- React + TypeScript + Vite: isolated static experiment, no coupling to the portfolio app.
- React Flow: accessible graph navigation, draggable nodes, pan/zoom and camera transitions.
- Native CSS: three token-based visual variations, responsive inspector, reduced-motion support.
- Lucide: consistent controls. No animation or global-state framework needed.
- Node test runner via tsx: relation and graph invariants.
- Browser localStorage: saved IDs and minimal game records only. No API credentials persisted.

Data path: provider -> normalized Game -> exact shared attributes -> bounded append -> React Flow. Detail requests recover developers missing from list payloads. Live expansion queries one developer, genre and tag in parallel, hydrates candidate details, verifies exact matches, and returns up to five unseen games. Session cache bounds repeated requests; no background recursion. Failures preserve the map and display retryable feedback.

The default catalog is a hand-authored fixture, not a current RAWG snapshot. Steam CDN header artwork is externally hosted; games and artwork belong to their owners. Live data links back to RAWG.

Sources checked 2026-09-04:
- https://rawg.io/apidocs — key required, attribution; pricing and terms text differ on commercial eligibility, so confirm applicable plan before commercial release.
- https://api.rawg.io/docs/ — endpoint reference.
- https://reactflow.dev/api-reference/react-flow — controlled nodes/edges and viewport API.

Local demo configuration: copy `.env.example` to ignored `.env.local` and set `VITE_RAWG_API_KEY`. Vite embeds `VITE_` variables in the browser bundle, so this avoids repeat entry during development but does not conceal the key. Production boundary: use a server-side key, request budgets/rate limiting and reviewed asset rights before public commercial deployment.
