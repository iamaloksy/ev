# EV Charging Finder

Single-repo app with:
- React frontend
- Express + Socket.IO backend (`server.js`)
- MongoDB via `MONGODB_URI`

## Environment

Create `.env` in project root with:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

Optional frontend API override for split deployments:

```env
REACT_APP_API_URL=http://localhost:5000
```

If `REACT_APP_API_URL` is not set, frontend calls same host (recommended for production).

## Run In Development

```bash
npm install
npm run dev
```

This runs backend and frontend together.

## Build + Host Together (Production)

```bash
npm install
npm run build
npm start
```

`npm start` runs `server.js`, and the server also serves the React `build` folder, so frontend + backend are hosted together from one process.

## Useful Scripts

- `npm run dev` -> backend + frontend together for development
- `npm run server` -> backend only
- `npm run start:client` -> frontend dev server only
- `npm run build` -> production frontend build
- `npm start` -> production server (serves API + static build)
