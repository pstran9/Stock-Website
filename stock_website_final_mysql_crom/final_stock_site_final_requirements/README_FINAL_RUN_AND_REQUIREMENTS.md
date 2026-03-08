Final Stock Trading System Build

Run order
1. In backend, copy .env.example to .env if needed.
2. Start MySQL (local or docker compose).
3. Run npm install.
4. Run npm run db:init.
5. Run npm run db:seed.
6. Run npm run dev.
7. Open frontend/index.html with VS Code Live Server.
8. If frontend does not connect, run in browser console:
   localStorage.setItem('apiOrigin', 'http://localhost:4000')

Default admin
- email: admin@example.com
- username: admin
- password: Passw0rd!

Functions included
- user registration and login
- deposit and withdraw cash
- buy and sell stocks at market price
- cancel pending order before execution
- portfolio view
- transaction history view
- create new stocks with company name, ticker, volume, and initial price
- change market hours
- change market holiday schedule
- stock list with ticker, price, volume, market cap, opening price, day high, and day low
- relational MySQL database backend
- random stock price generator
