This package combines the frontend files from the main branch layout with the patched backend folder.

What was fixed:
- Frontend main.js updated to use backend-compatible routes and a configurable API origin.
- Hardcoded insecure http://35.153.95.86 removed from main.js.
- Added missing main-branch pages: admin_edit_hours.html, user_deposit.html, user_withdraw.html, create_account.html.
- Included patched backend folder: stock-trading-backend-crom.

Important deployment note:
- For an HTTPS frontend, the backend must also be reachable over HTTPS (or through a reverse proxy / load balancer).
- Set the backend origin in the browser with:
  localStorage.setItem('apiOrigin', 'https://YOUR-BACKEND-URL');
  then refresh.
- Or define window.__API_ORIGIN__ before loading main.js.
