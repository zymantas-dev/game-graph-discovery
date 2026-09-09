# Goals and acceptance

Audience: players exploring adjacent games and clients evaluating a rich media catalog experience.

The demo should make the first connection understandable in ten seconds: a player searches for their own starting game, then sees it visibly connected to related titles with a named reason on every edge.

- Select a neighbor: inspect it, smoothly focus the camera, append at most five unseen games.
- Search: find a new starting point without losing the existing graph.
- Filter connections by all attributes, developers, genres, or tags.
- Pan, zoom, fit the map, revisit a trail item, and start fresh with an empty map.
- Save games locally and revisit them from a collection.
- Compare three visual directions in the running app.
- Connect a personal RAWG key for live search and exact-attribute expansion; show loading, errors, and exhausted results.
- Keep mobile controls reachable and provide a list as an accessible alternative to the graph.

Out of scope: multiplayer, accounts, purchasing, trailers, recommendation ML, automatic infinite crawling.

Verification: pure relation/deduplication/cap tests, TypeScript and production build, desktop/mobile smoke tests. Live RAWG access requires a user-provided key.
