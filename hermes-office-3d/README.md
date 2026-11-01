# Hermes Office 3D

A local 3D version of your Hermes Game Studio, inspired by [Hermes3D](https://github.com/iamlukethedev/Hermes3D). The room and characters are modeled directly in Three.js; no remote models, image generation, or CDN assets are required.

## Run

Keep your original Hermes studio running at **http://127.0.0.1:4317**. From this directory:

```powershell
pnpm install --frozen-lockfile
pnpm build
node server.mjs
```

Open **http://127.0.0.1:4318**. After the first build, only `node server.mjs` is needed. Use Node.js 22.12+ and pnpm 11; this checkout was built with Node 24.

For development, use `pnpm dev`. The production server binds to the local machine and forwards `/api/*` to the original studio. To use a different local backend or frontend port:

```powershell
$env:HERMES_STUDIO_URL = 'http://127.0.0.1:4317'
$env:PORT = '4318'
node server.mjs
```

The development proxy uses port 4317 in `vite.config.js`.

## Explore

- Drag to orbit. Right-drag to pan. Scroll or pinch to zoom.
- Click the floor to walk around furniture, or use WASD, arrow keys, or the directional pad.
- Click a character, desk, or floating name to open that agent's conversation.
- Walk near a desk and press **E** to talk.
- Use **Oficina** and **Sala TV** to move between the two zones.
- The camera toolbar provides fit, overhead, follow, and fullscreen views. Opening a conversation leaves fullscreen so the chat stays visible.
- Click the cabinet to choose an existing project; click the TV to view a result, or the wall display to inspect Codex usage.

The six agents keep their existing identities: Camilo, Santi, Cata, Vale, Nico, and Pipe. The original project cabinet, streaming chat, history, gallery, uploads, Codex usage, and local voice interface remain connected to the existing backend. Working agents animate from real status updates. The 3D TV displays the selected saved image; videos open in the existing media player when clicked.

## Data and implementation

The original studio owns all conversations, projects, files, voice processing, and agent execution. This app adds a rendering layer and a streaming HTTP proxy; it does not copy conversation data into this repository or start a separate agent runtime. If the original studio is unavailable, the scene stays visible and the interface reports the connection failure. The browser's EventSource reconnects when the studio becomes available.

- `src/office-3d.js`: diorama, actors, orbit camera, raycasting, movement, live TV, and display updates.
- `src/app.js`: existing office workflows, adapted to initialize the 3D renderer.
- `src/navigation.js` and `src/vector-room.js`: shared room coordinates, collision map, and pathfinding from the current studio.
- `src/office-3d.css`: responsive 3D interface styling.
- `reference/`: snapshot of the current studio's frontend source, without runtime data.
- `scripts/prepare-ui.mjs`: reproduces `index.html` and `src/app.js` from the reference frontend. Run it only when updating that integration, then rebuild.
- `server.mjs`: local static server and streaming API proxy.

WebGL is required. If it cannot initialize, the interface provides a link back to the original office. Reduced-motion preferences disable walking bounce, typing animation, and camera easing.

## Verification

```powershell
pnpm test
pnpm build
```

Tests cover paths to every desk, the lounge, and cabinet; furniture collisions; static assets; chat request forwarding; server-sent events; and rejection of remote backends or unrelated browser origins. Integration tests use temporary local mock servers and do not send messages to the real agents.

Browser checks confirmed the real roster and history load, saved artwork displays on the 3D TV, agent selection and walk-up conversation work, and camera controls operate. Microphone capture and new live chat submissions are intentionally left to the user; they were not exercised during verification.
