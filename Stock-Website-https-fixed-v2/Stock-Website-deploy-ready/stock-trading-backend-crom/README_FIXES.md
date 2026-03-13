Backend patch summary

Files included
- src/shared/env.js
- src/app.js
- src/controllers/stocks.controller.js
- src/controllers/admin.controller.js
- src/controllers/trades.controller.js
- src/routes/admin.routes.js

What these fixes do
1. CORS now supports multiple allowed origins, including both the S3 website URL and the HTTPS S3 object URL.
2. /api/stocks now returns a raw array shaped the way the current frontend expects.
3. Stock objects are normalized so snake_case DB fields still work with frontend price rendering.
4. Admin stock creation/update accepts either lastPrice or price for compatibility.
5. Portfolio/transactions responses are shaped to better match the current frontend expectations.

Important
This patch fixes backend-side compatibility problems, but it does NOT fix the browser mixed-content problem by itself.
frontend is still calling an HTTP backend URL from an HTTPS page. The frontend/deployment config still needs to use an HTTPS backend endpoint.

Recommended .env setting
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://stocktrader-frontend-pt-tm20.s3-website-us-east-1.amazonaws.com,https://stocktrader-frontend-pt-tm20.s3.us-east-1.amazonaws.com

After replacing these files
1. Redeploy backend.
2. Test /health
3. Test /api/stocks
4. Test /api/auth/register
5. Test admin stock create/update from the frontend


## Added in this package
- Register flow now accepts a username from the frontend.
- Fresh databases create `users.username`; existing databases can add it with `sql/003_add_username.sql`.
- Frontend only loads stock/market-hours APIs on pages that actually need them.
