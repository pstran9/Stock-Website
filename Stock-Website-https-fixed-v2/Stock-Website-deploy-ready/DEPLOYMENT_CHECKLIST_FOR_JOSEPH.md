# Deployment checklist for Joseph

1. Deploy the backend on a public host that serves **HTTPS**. A raw `http://` IP is not enough for a site that will be shared with your team or professor.
2. Put the public backend **HTTPS** URL in `config.js`:

```js
window.__API_ORIGIN__ = "https://YOUR-BACKEND-HTTPS-URL";
```

3. Deploy the frontend on a public website URL. If you want the frontend itself to be HTTPS, use CloudFront or another HTTPS-capable host. The plain S3 `s3-website-...amazonaws.com` endpoint is HTTP only.
4. Set backend environment variables correctly: `JWT_SECRET`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CORS_ORIGIN`.
5. Include the real public frontend URL in backend `CORS_ORIGIN`.
6. Test these endpoints after deploy: `/health`, `/api/stocks`, `/api/auth/register`, `/api/auth/login`.
7. Hard refresh the browser or clear site data after changing `config.js` or `localStorage.apiOrigin`.

- If the existing database was created before username support, run `stock-trading-backend-crom/sql/003_add_username.sql`.
