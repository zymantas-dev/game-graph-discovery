import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, Background, Controls, Handle, Position, applyNodeChanges, type Node, type NodeProps, type ReactFlowInstance } from '@xyflow/react';
import { ArrowDownRight, ArrowUpRight, Bookmark, Check, Compass, GitBranch, Grid2X2, Maximize, Network, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { type Game } from './data';
import { createProvider } from './api';
import { connect, sharedAttributes, type Connection, type Filter } from './graph';
import '@xyflow/react/dist/style.css';
import './style.css';

type GameNode = Node<{ game: Game; active: boolean; saved: boolean }, 'game'>;
const filters: [Filter, string][] = [['all', 'All connections'], ['developer', 'Developer'], ['tag', 'Tags'], ['genre', 'Genre']];
const Card = memo(function Card({ data }: NodeProps<GameNode>) {
  return <div className={`game-node ${data.active ? 'active' : ''}`}>
    <div className="node-art">{data.game.image && <img src={data.game.image} alt="" draggable={false} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}<span className="node-year">{data.game.year}</span>{data.saved && <Bookmark className="node-saved" size={16} fill="currentColor" />}</div>
    <div className="node-copy"><small>{data.active ? 'YOU ARE HERE' : data.game.attributes.find(a => a.kind === 'developer')?.name}</small><strong>{data.game.name}</strong><ArrowUpRight size={17} /></div>
    {[Position.Left, Position.Right, Position.Top, Position.Bottom].flatMap(position => (['source', 'target'] as const).map(type => <Handle key={`${type}-${position}`} id={`${type}-${position}`} type={type} position={position} />))}
  </div>;
});
const nodeTypes = { game: Card };
const configuredRawgKey = import.meta.env.VITE_RAWG_API_KEY?.trim() ?? '';
const initialPositions = [{ x: 0, y: 0 }, { x: -310, y: -130 }, { x: 10, y: -245 }, { x: 310, y: -100 }, { x: 270, y: 180 }, { x: -290, y: 180 }];
function makeNode(game: Game, position: { x: number; y: number }): GameNode { return { id: game.id, type: 'game', position, data: { game, active: false, saved: false }, ariaLabel: `Explore ${game.name}` }; }
function loadSaved(): Game[] {
  try { const value = JSON.parse(localStorage.getItem('thread-saved-v1') ?? '[]'); return Array.isArray(value) ? value.filter(g => typeof g?.id === 'string' && typeof g?.name === 'string' && Array.isArray(g?.attributes)) : []; } catch { return []; }
}
function App() {
  const [provider, setProvider] = useState(() => createProvider(configuredRawgKey));
  const [nodes, setNodes] = useState<GameNode[]>([]);
  const nodesRef = useRef<GameNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selected, setSelected] = useState<Game | null>(null);
  const [trail, setTrail] = useState<Game[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [theme, setTheme] = useState('observatory');
  const [saved, setSaved] = useState<Game[]>(loadSaved);
  const [collection, setCollection] = useState(false);
  const [list, setList] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Follow a connection. Find your next world.');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const flow = useRef<ReactFlowInstance<GameNode> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const searchGeneration = useRef(0);
  const duration = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
  function updateNodes(value: GameNode[]) { nodesRef.current = value; setNodes(value); }
  function fit() { void flow.current?.fitView({ padding: .12, duration: duration(), maxZoom: 1 }); }
  function reset() {
    ++generation.current;
    ++searchGeneration.current;
    lock.current = false;
    updateNodes([]); setConnections([]); setSelected(null); setTrail([]); setFilter('all');
    setResults(null); setQuery(''); setSearching(false); setBusy(false); setError('');
    setStatus('Choose a game to begin your discovery map.');
  }
  useEffect(() => { void reset(); return () => { generation.current++; }; }, [provider]);
  async function explore(game: Game) {
    if (lock.current) return;
    const token = generation.current;
    lock.current = true; setBusy(true); setError(''); setResults(null); setCollection(false);
    try {
      const full = await provider.detail(game.id);
      if (token !== generation.current) return;
      let current = nodesRef.current;
      if (!current.some(node => node.id === full.id)) {
        if (current.length >= 60) { setStatus('Map is full. Reset to start a new exploration.'); return; }
        current = [...current, makeNode(full, current.length ? { x: Math.max(...current.map(n => n.position.x), 0) + 380, y: 0 } : initialPositions[0])];
      }
      setSelected(full); setTrail(previous => [...previous.filter(g => g.id !== full.id), full].slice(-8));
      const center = current.find(node => node.id === full.id)!;
      const viewport = flow.current?.getViewport();
      if (viewport) void flow.current?.setCenter(center.position.x + 118, center.position.y + 90, { zoom: viewport.zoom, duration: duration() });
      const next = await provider.expand(full, current.map(node => node.id), filter);
      if (token !== generation.current) return;
      const added: GameNode[] = [];
      for (let i = 0; i < next.length; i++) {
        let position = { x: 0, y: 0 };
        for (let attempt = 0; attempt < 200; attempt++) {
          const angle = (i * 1.256) + attempt * 2.4;
          const radius = 390 + Math.floor(attempt / 8) * 230;
          position = { x: center.position.x + Math.cos(angle) * radius, y: center.position.y + Math.sin(angle) * radius * .7 };
          if (![...current, ...added].some(n => Math.abs(n.position.x - position.x) < 290 && Math.abs(n.position.y - position.y) < 230)) break;
        }
        added.push(makeNode(next[i], position));
      }
      updateNodes([...current, ...added]);
      setConnections(previous => [...previous, ...connect(full, next, filter)]);
      setStatus(next.length ? `${next.length} new connections from ${full.name}. Keep following your curiosity.` : `No unseen ${filter === 'all' ? '' : filter + ' '}connections found. Try another filter or search for a game.`);
    } catch (e) { if (token === generation.current) setError(e instanceof Error ? e.message : 'Could not expand this game. Try again.'); }
    finally { if (token === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function search(event: React.FormEvent) {
    event.preventDefault(); if (!query.trim()) return;
    const token = ++searchGeneration.current; setSearching(true); setError('');
    try { const games = await provider.search(query.trim()); if (token === searchGeneration.current) setResults(games); }
    catch (e) { if (token === searchGeneration.current) setError(e instanceof Error ? e.message : 'Search failed.'); }
    finally { if (token === searchGeneration.current) setSearching(false); }
  }
  function save() {
    if (!selected) return;
    const next = saved.some(game => game.id === selected.id) ? saved.filter(game => game.id !== selected.id) : [...saved, selected];
    setSaved(next);
    try { localStorage.setItem('thread-saved-v1', JSON.stringify(next)); } catch { setStatus('Saved for this session. Browser storage is unavailable.'); }
  }
  const visibleNodes = useMemo(() => nodes.map(node => ({ ...node, data: { ...node.data, active: node.id === selected?.id, saved: saved.some(game => game.id === node.id) } })), [nodes, selected?.id, saved]);
  const edges = useMemo(() => connections.flatMap(connection => {
    const source = nodes.find(n => n.id === connection.source);
    const target = nodes.find(n => n.id === connection.target);
    const a = source?.data.game;
    const b = target?.data.game;
    const attribute = a && b ? sharedAttributes(a, b, filter)[0] : undefined;
    const dx = (target?.position.x ?? 0) - (source?.position.x ?? 0);
    const dy = (target?.position.y ?? 0) - (source?.position.y ?? 0);
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const from = horizontal ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
    const to = horizontal ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'top' : 'bottom');
    return attribute ? [{ id: `${connection.source}-${connection.target}`, source: connection.source, target: connection.target, sourceHandle: `source-${from}`, targetHandle: `target-${to}`, label: attribute.name, type: 'default', className: `relation-${attribute.kind}`, style: { stroke: 'var(--line)', strokeWidth: 1.4 }, labelStyle: { fill: 'var(--muted)', fontSize: 11 }, labelBgStyle: { fill: 'var(--canvas)' }, labelBgPadding: [8, 5] as [number, number], labelBgBorderRadius: 4 }] : [];
  }), [connections, nodes, filter]);
  const isSaved = selected ? saved.some(game => game.id === selected.id) : false;
  const shownGames = collection ? saved.filter(game => provider.live ? /^\d+$/.test(game.id) : !/^\d+$/.test(game.id)) : nodes.map(node => node.data.game);
  return <div className={`app ${theme}`}>
    <header><a className="brand" href="./" aria-label="Thread home"><Network size={26} strokeWidth={1.5} />THREAD<span>GAME DISCOVERY</span></a><nav aria-label="Main navigation"><button className={!collection ? 'nav-active' : ''} onClick={() => setCollection(false)}><Compass size={16} />Explore</button><button className={collection ? 'nav-active' : ''} onClick={() => setCollection(true)}><Bookmark size={16} />Collection <span className="count">{saved.length}</span></button></nav><button className="connect-button" onClick={() => dialog.current?.showModal()}><span className="status-dot"/>{provider.live ? 'RAWG connected' : 'Connect RAWG'}<ArrowUpRight size={14}/></button></header>
    <main><section className="intro"><div><p className="eyebrow">GOOD GAMES DON’T EXIST IN ISOLATION</p><h1>Follow what you <em>love.</em><ArrowDownRight aria-hidden="true" /></h1><p>One game leads to another. Discover the connections in between.</p></div>{selected && <div className="search-wrap"><form onSubmit={search} role="search"><Search size={18}/><input aria-label="Search games" placeholder="Search for another game…" value={query} onChange={e => { setQuery(e.target.value); ++searchGeneration.current; setSearching(false); setResults(null); }}/><button type="submit" disabled={searching || !query.trim()}>{searching ? 'Finding…' : 'Find'}<ArrowUpRight size={14}/></button></form>{results !== null && <div className="search-results"><div className="result-heading"><small>{results.length ? 'CHOOSE YOUR NEXT CONNECTION' : 'No games found. Try another title.'}</small><button aria-label="Close search" onClick={() => setResults(null)}><X size={16}/></button></div>{results.map(game => <button key={game.id} disabled={busy} onClick={() => void explore(game)}><span>{game.name}</span><small>{game.year}</small><ArrowUpRight size={14}/></button>)}</div>}<span className="search-hint">Try “Hollow Knight”, “The Witcher” or “Hades”</span></div>}</section>
    <section className={`workspace ${selected || collection ? '' : 'start-workspace'}`} aria-label="Game discovery workspace"><div className="map-area"><div className="map-toolbar"><div className="map-title"><span className="status-dot"/>{collection ? 'YOUR COLLECTION' : 'DISCOVERY MAP'}<span className="map-count">{collection ? shownGames.length : nodes.length} games</span></div><div className="map-actions"><button aria-label="Toggle list view" aria-pressed={list} onClick={() => setList(!list)}>{list ? <Network size={17}/> : <Grid2X2 size={17}/>}</button><button aria-label="Fit map" disabled={!selected} onClick={fit}><Maximize size={17}/></button><button aria-label="Reset exploration" disabled={busy || !selected} onClick={() => { setCollection(false); reset(); }}><RotateCcw size={17}/></button></div></div>
    {selected && <div className="filter-bar" aria-label="Connection filters">{filters.map(([value, label]) => <button aria-pressed={filter === value} className={filter === value ? 'chosen' : ''} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div>}
    <div className="canvas">{collection || list ? <div className="game-list">{!shownGames.length && <div className="empty"><Bookmark size={32}/><h2>A world worth coming back to.</h2><p>Save a game from its detail panel to start your collection.</p></div>}{shownGames.map(game => <button className="list-game" key={game.id} disabled={busy} onClick={() => void explore(game)}><img src={game.image} alt=""/><div><small>{game.year}</small><strong>{game.name}</strong></div><ArrowUpRight size={18}/></button>)}</div> : selected ? <ReactFlow<GameNode> nodes={visibleNodes} edges={edges} nodeTypes={nodeTypes} onInit={instance => { flow.current = instance; }} onNodesChange={changes => updateNodes(applyNodeChanges(changes, nodesRef.current))} onNodeClick={(_, node) => void explore(node.data.game)} nodesConnectable={false} deleteKeyCode={null} minZoom={.18} maxZoom={1.5}><Background gap={28} size={1} color="var(--grid)"/><Controls showInteractive={false}/></ReactFlow> : <div className="start-state"><Network size={35}/><p className="eyebrow">YOUR MAP IS WAITING</p><h2>Where should we begin?</h2><p>Search for a game you love. We’ll map the worlds, creators, and ideas it shares.</p><form onSubmit={search} role="search"><Search size={19}/><input autoFocus aria-label="Choose your first game" placeholder="Search for your first game…" value={query} onChange={e => { setQuery(e.target.value); ++searchGeneration.current; setSearching(false); setResults(null); }}/><button type="submit" disabled={searching || !query.trim()}>{searching ? 'Finding…' : 'Search'}<ArrowUpRight size={15}/></button></form>{results !== null && <div className="start-results"><small>{results.length ? 'CHOOSE YOUR FIRST GAME' : 'No games found. Try another title.'}</small>{results.map(game => <button key={game.id} disabled={busy} onClick={() => void explore(game)}><span>{game.name}</span><span>{game.year}<ArrowUpRight size={14}/></span></button>)}</div>}<span className="search-hint">Try “Hollow Knight”, “The Witcher” or “Hades”</span></div>}
    {selected && !collection && !list && <div className="map-note"><GitBranch size={14}/><span>Shared ideas. New worlds.</span></div>}</div>
    <div className="map-footer"><span><span className="status-dot"/>{provider.live ? 'LIVE RAWG DATA' : 'CURATED DEMO'}</span><span>{selected ? <>{edges.length} connections<span className="footer-hint"> · Drag to explore · Scroll to zoom</span></> : 'Choose a starting game'}</span></div></div>
    {selected && <aside className="inspector" aria-label="Selected game"><div className="inspector-label"><span>IN FOCUS</span><span>{selected.year}<ArrowUpRight size={14}/></span></div><div className="detail-art">{selected.image && <img src={selected.image} alt={`${selected.name} artwork`} onError={e => { e.currentTarget.style.visibility = 'hidden'; }}/>}<span>FOLLOW THE THREAD</span></div><div className="detail-content"><p className="eyebrow">{selected.attributes.find(a => a.kind === 'developer')?.name ?? 'DISCOVER SOMETHING NEW'}</p><h2>{selected.name}</h2><p className="description">{selected.description}</p><button className={`save-button ${isSaved ? 'saved' : ''}`} onClick={save}>{isSaved ? <Check size={16}/> : <Bookmark size={16}/>} {isSaved ? 'Saved to collection' : 'Save for later'}<span>{isSaved ? '✓' : '+'}</span></button><div className="attribute-heading"><span>ITS CONNECTING THREADS</span><SlidersHorizontal size={14}/></div><div className="tags">{selected.attributes.slice(0, 10).map(a => <button title={`Filter by ${a.kind}`} key={`${a.kind}-${a.id}`} onClick={() => setFilter(a.kind)}><span className={`tag-dot ${a.kind}`}/>{a.name}</button>)}</div><button className="expand-button" disabled={busy} onClick={() => void explore(selected)}>{busy ? 'Following connections…' : 'Explore connections'}<ArrowUpRight size={17}/></button><a className="source-link" href={selected.url} target="_blank" rel="noreferrer">View on {provider.live ? 'RAWG' : 'Steam'}<ArrowUpRight size={13}/></a></div></aside>}</section>
    <div className="feedback" role="status" aria-live="polite">{error ? <><span className="error">{error}</span><button onClick={() => selected ? void explore(selected) : reset()}>Retry</button></> : <><span className={busy ? 'status-dot pulsing' : 'status-dot'}/>{busy ? 'Finding your next connection…' : status}</>}</div>
    {selected && <section className="trail" aria-label="Exploration trail"><span>YOUR TRAIL</span><div>{trail.map((game, index) => <React.Fragment key={game.id}>{index > 0 && <span className="trail-arrow">→</span>}<button disabled={busy} className={game.id === selected.id ? 'current' : ''} onClick={() => void explore(game)}>{game.name}</button></React.Fragment>)}</div><button className="clear-trail" disabled={busy} onClick={reset}>Start fresh<RotateCcw size={13}/></button></section>}
    <footer><span>Made for the joy of getting lost.</span><div><label htmlFor="appearance">DESIGN</label><select id="appearance" value={theme} onChange={e => setTheme(e.target.value)}><option value="observatory">01 / Observatory</option><option value="field-notes">02 / Field Notes</option><option value="blueprint">03 / Arcade Blueprint</option></select><a href="https://rawg.io" target="_blank" rel="noreferrer">{provider.live ? 'Data by RAWG' : 'Powered by curiosity · RAWG ready'}<ArrowUpRight size={12}/></a></div></footer></main>
    <dialog ref={dialog} onClose={() => setKeyInput('')}><div className="dialog-heading"><h2>Connect your worlds.</h2><button aria-label="Close RAWG settings" onClick={() => dialog.current?.close()}><X size={20}/></button></div><p>Use a temporary key for this tab, or configure <code>VITE_RAWG_API_KEY</code> in <code>.env.local</code> to connect automatically whenever the demo starts.</p><form onSubmit={e => { e.preventDefault(); if (!keyInput.trim()) return; setProvider(createProvider(keyInput.trim())); setKeyInput(''); updateNodes([]); setConnections([]); dialog.current?.close(); }}><label htmlFor="rawg-key">Temporary RAWG API key</label><input id="rawg-key" type="password" autoComplete="off" value={keyInput} onChange={e => setKeyInput(e.target.value)} required/><button className="expand-button" type="submit">Connect for this tab<ArrowUpRight size={16}/></button></form><a href="https://rawg.io/apidocs" target="_blank" rel="noreferrer">Get a key from RAWG ↗</a><button className="demo-button" onClick={() => { setProvider(createProvider(configuredRawgKey)); dialog.current?.close(); }}>{configuredRawgKey ? 'Use configured API key' : 'Continue with curated demo'}</button></dialog>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
