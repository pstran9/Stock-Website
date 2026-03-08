# Stock Trading System — Strong Backend (Node.js/Express + MySQL)

This backend is designed to be **production-like** for a capstone:
- Clear layering (routes → controllers → services → repositories)
- JWT auth + RBAC (USER/ADMIN)
- Input validation (Zod)
- Rate limiting + security headers (helmet)
- Transaction-safe buy/sell with database locks
- Quote/price generation + optional price history
- Swagger docs at `/api/docs`

---

## Quick Start (Local)

### Option A: Local MySQL
1. Create a MySQL database (e.g., `stock_trading`)
2. Copy env:
```bash
cp .env.example .env
npm i
npm run db:init
npm run db:seed
npm run dev
```

### Option B: Docker MySQL
```bash
docker compose up -d
cp .env.example .env
# set DB_PASSWORD=root in .env for docker
npm i
npm run db:init
npm run db:seed
npm run dev
```

API: `http://localhost:4000`  
Docs: `http://localhost:4000/api/docs`

---

## Default Admin (seed)
- Email: `admin@example.com`
- Password: `Passw0rd!`

Change it after first login in a real deployment.

---

## Core Endpoints

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`

Stocks:
- `GET /api/stocks`
- `GET /api/stocks/:ticker`
- `GET /api/stocks/:ticker/quote`

Trades:
- `POST /api/trades/buy`
- `POST /api/trades/sell`
- `GET /api/trades/portfolio`
- `GET /api/trades/transactions`

Admin:
- `POST /api/admin/stocks` (create)
- `PATCH /api/admin/stocks/:ticker`
- `DELETE /api/admin/stocks/:ticker`
- `GET /api/admin/market/status`
- `GET /api/admin/market/hours`
- `POST /api/admin/market/hours`

---

## Notes (Capstone-friendly realism)
- Market hours are stored in DB (UTC).  
- Holiday list is stored in DB (easy to update without code changes).  
- Price generation uses a simple stochastic model (geometric random walk).

---

## Included `.env`
This package now includes a ready-to-use `.env` file configured for the included Docker MySQL setup:
- DB host: `localhost`
- DB port: `3306`
- DB user: `root`
- DB password: `root`
- DB name: `stock_trading`
- API port: `4000`

## Fastest Local Run (Windows or Mac)
From the `backend` folder:
```bash
docker compose up -d
npm install
npm run db:init
npm run db:seed
npm run dev
```

Then open the frontend with a local server. If you use VS Code Live Server, the default frontend URL is often `http://127.0.0.1:5500` or `http://localhost:5500`. If needed, in the browser console run:
```js
localStorage.setItem('apiOrigin', 'http://localhost:4000')
```

## Quick Demo Accounts
Admin:
- `admin@example.com`
- `Passw0rd!`

Sample user can be created from the Register page.
