# Stock Trading System - Completed Frontend + Backend

## What is included
- `backend/` Node.js + Express + MySQL API
- `frontend/` static website pages for users and admins
- Authentication, stock listing, buy/sell trading, portfolio, transaction history, deposit/withdraw, admin stock management, dashboard statistics

## Run backend
1. `cd backend`
2. `cp .env.example .env`
3. Update `.env` with your MySQL credentials
4. `npm install`
5. `npm run db:init`
6. `npm run db:seed`
7. `npm run dev`

API runs at `http://localhost:4000`
Swagger docs at `http://localhost:4000/api/docs`
Frontend can be opened from `frontend/index.html` using Live Server, or served by the backend if launched from the backend folder.

## Demo credentials
- Admin: `admin@example.com` / `Passw0rd!`

## Included working business functions
- Register account
- Login
- View stocks
- Buy stock
- Sell stock
- Deposit funds
- Withdraw funds
- View portfolio
- View transaction history
- Admin add/edit/delete stocks
- Admin dashboard statistics
- Market hours and holiday enforcement
- Random stock price updates/quotes
