# Product constitution

1. Discovery is relational. Every connection must name an exact shared developer, genre, or tag. Never invent a recommendation score.
2. Start with a deliberately chosen game. Selecting the first game creates the map and adds up to five unseen related games. Previously discovered nodes survive expansion.
3. Recursion is user-driven, never an unbounded background crawl. Deduplicate by provider ID and cap the visible map at 60 games.
4. A useful demo requires no account or key. Curated fixtures are explicitly labeled; live failures never silently masquerade as live results.
5. Artwork supports navigation. Titles and controls remain usable when images fail. Keyboard focus, touch layouts, and reduced motion are first-class.
6. The canvas owns the experience. Navigation and details stay compact; product copy explains discovery rather than implementation.
7. A personal demo may read `VITE_RAWG_API_KEY` from an ignored local environment file or accept a session-only key. Production shared credentials require a server proxy.
8. Done means tested graph invariants, a passing build, and browser evidence. Do not claim external API success without a real request.
