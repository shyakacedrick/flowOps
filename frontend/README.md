# FlowOps Frontend

React 18 + Vite 5 SPA — owner dashboard, staff console, customer flow analytics, and platform-admin tooling for the FlowOps queue management platform.

See the [project root README](../README.md) for the live demo, architecture overview, deployment, and full setup instructions.

## Local development

```bash
cp .env.example .env.local       # default points at http://localhost:5000/api
npm install
npm run dev                      # serves on http://localhost:5173
```

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |

## Tunnel / mobile testing

To expose the dev server through ngrok (e.g. for testing on a phone):

```powershell
# PowerShell
$env:VITE_TUNNEL = "1"
npm run dev
```

The `VITE_TUNNEL` flag switches HMR to `clientPort: 443` so the websocket survives the HTTPS tunnel. Leave the variable unset for normal localhost dev.
