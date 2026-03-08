const API_ORIGIN = localStorage.getItem('apiOrigin') || 'http://localhost:4000';
function apiUrl(path) { return `${API_ORIGIN}${path}`; }
function getToken() { return localStorage.getItem('authToken'); }
function getUser() { const raw = localStorage.getItem('currentUser'); return raw ? JSON.parse(raw) : null; }
function saveUser(user) { localStorage.setItem('currentUser', JSON.stringify(user)); }
function logout() { localStorage.removeItem('authToken'); localStorage.removeItem('currentUser'); window.location.href = 'login.html'; }
async function apiFetch(path, options = {}) { const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }; const token = getToken(); if (token) headers.Authorization = `Bearer ${token}`; return fetch(apiUrl(path), { ...options, headers }); }
async function parseJsonSafe(response) { try { return await response.json(); } catch { return {}; } }
function showAlert(message, type = 'success') { const box = document.getElementById('pageAlert'); if (!box) return alert(message); box.className = `alert ${type}`; box.textContent = message; box.style.display = 'block'; }
function updateNavForRole() { const user = getUser(); document.querySelectorAll('[data-username]').forEach((el) => { el.textContent = user ? user.fullName || user.email : 'Guest'; }); }

async function loadStocks() {
  const response = await apiFetch('/api/stocks');
  const data = await parseJsonSafe(response);
  const stocks = data.stocks || [];
  const tableBody = document.getElementById('marketTableBody') || document.getElementById('adminTableBody');
  if (tableBody) {
    const isAdmin = tableBody.id === 'adminTableBody';
    tableBody.innerHTML = '';
    stocks.forEach((stock) => {
      const row = document.createElement('tr');
      row.innerHTML = isAdmin
        ? `<td>${stock.symbol}</td><td>${stock.company}</td><td>$${Number(stock.price).toFixed(2)}</td><td>${Number(stock.volume).toLocaleString()}</td><td>$${Number(stock.marketCap).toLocaleString()}</td><td>$${Number(stock.openingPrice).toFixed(2)}</td><td>$${Number(stock.high).toFixed(2)}</td><td>$${Number(stock.low).toFixed(2)}</td><td class="actions-cell"><button class="button primary" onclick="prefillEditStock('${stock.symbol}')">Edit</button><button class="button danger" onclick="deleteStock('${stock.symbol}')">Delete</button></td>`
        : `<td>${stock.symbol}</td><td>${stock.company}</td><td>$${Number(stock.price).toFixed(2)}</td><td>${Number(stock.volume).toLocaleString()}</td><td>$${Number(stock.marketCap).toLocaleString()}</td><td>$${Number(stock.openingPrice).toFixed(2)}</td><td>$${Number(stock.high).toFixed(2)}</td><td>$${Number(stock.low).toFixed(2)}</td><td class="actions-cell"><button class="button success" onclick="submitTrade('buy','${stock.symbol}')">Buy</button><button class="button danger" onclick="submitTrade('sell','${stock.symbol}')">Sell</button><button class="button secondary" onclick="createPendingOrder('BUY','${stock.symbol}')">Queue</button></td>`;
      tableBody.appendChild(row);
    });
  }
  const stockCount = document.getElementById('stockCount'); if (stockCount) stockCount.textContent = stocks.length;
  return stocks;
}

async function submitTrade(type, symbol) {
  if (!getToken()) return window.location.href = 'login.html';
  const quantity = prompt(`Enter number of shares to ${type}:`); if (!quantity) return;
  const response = await apiFetch(`/api/trades/${type}`, { method: 'POST', body: JSON.stringify({ ticker: symbol, shares: Number(quantity) }) });
  const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || `Unable to ${type} stock.`, 'error');
  showAlert(data.message || `${type} completed successfully.`); await refreshSecureViews();
}

async function createPendingOrder(type, symbol) {
  if (!getToken()) return window.location.href = 'login.html';
  const quantity = prompt(`Enter number of shares to place as a pending ${type} order:`); if (!quantity) return;
  const response = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify({ ticker: symbol, type, shares: Number(quantity) }) });
  const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Unable to create order.', 'error');
  showAlert(data.message || 'Pending order created.');
}

async function cancelOrder(id) {
  const response = await apiFetch(`/api/orders/${id}/cancel`, { method: 'POST' });
  const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Unable to cancel order.', 'error');
  showAlert(data.message || 'Order cancelled.'); await loadOrders();
}
window.cancelOrder = cancelOrder;

async function loadOrders() {
  const body = document.getElementById('ordersTableBody'); if (!body) return;
  const response = await apiFetch('/api/orders'); const data = await parseJsonSafe(response);
  const orders = data.orders || [];
  body.innerHTML = orders.map((o) => `<tr><td>${new Date(o.created_at).toLocaleString()}</td><td>${o.type}</td><td>${o.ticker}</td><td>${Number(o.shares).toFixed(2)}</td><td>$${Number(o.requested_price).toFixed(2)}</td><td>${o.status}</td><td>${o.status === 'PENDING' ? `<button class="button danger" onclick="cancelOrder(${o.id})">Cancel</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="7">No orders yet.</td></tr>';
}

async function loadDashboard() {
  const response = await apiFetch('/api/user/dashboard'); const data = await parseJsonSafe(response); if (!response.ok) return;
  const cash = document.getElementById('cashBalance'); const portfolioValue = document.getElementById('portfolioValue'); const holdingsCount = document.getElementById('holdingsCount');
  if (cash) cash.textContent = `$${Number(data.cashBalance).toFixed(2)}`;
  if (portfolioValue) portfolioValue.textContent = `$${Number(data.totalPortfolioValue).toFixed(2)}`;
  if (holdingsCount) holdingsCount.textContent = data.portfolio.length;
}
async function loadPortfolio() { const response = await apiFetch('/api/trades/portfolio'); const data = await parseJsonSafe(response); const portfolio = data.portfolio || []; const body = document.getElementById('portfolioTableBody'); if (!body) return; body.innerHTML = portfolio.map((item) => `<tr><td>${item.symbol}</td><td>${item.company}</td><td>${Number(item.quantity).toFixed(2)}</td><td>$${Number(item.avgPrice).toFixed(2)}</td><td>$${Number(item.currentPrice).toFixed(2)}</td><td>$${Number(item.value).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="6">No holdings yet.</td></tr>'; }
async function loadTransactions() { const response = await apiFetch('/api/trades/transactions'); const data = await parseJsonSafe(response); const transactions = data.items || []; const body = document.getElementById('transactionsTableBody'); if (!body) return; body.innerHTML = transactions.map((item) => `<tr><td>${new Date(item.timestamp).toLocaleString()}</td><td>${item.type}</td><td>${item.symbol || '-'}</td><td>${Number(item.quantity).toFixed(2)}</td><td>$${Number(item.price).toFixed(2)}</td><td>$${Number(item.amount).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="6">No transactions yet.</td></tr>'; }
async function loadAdminStats() { const response = await apiFetch('/api/admin/stats'); const data = await parseJsonSafe(response); if (!response.ok) return; if (document.getElementById('totalUsers')) document.getElementById('totalUsers').textContent = data.totalUsers; if (document.getElementById('totalStocks')) document.getElementById('totalStocks').textContent = data.totalStocks; if (document.getElementById('totalTransactions')) document.getElementById('totalTransactions').textContent = data.totalTransactions; }
async function loadMarketConfig() {
  const hoursList = document.getElementById('hoursList');
  if (hoursList) { const res = await apiFetch('/api/admin/market/hours'); const data = await parseJsonSafe(res); hoursList.innerHTML = `<pre>${JSON.stringify(data.hours || [], null, 2)}</pre>`; }
  const holidayBody = document.getElementById('holidayTableBody');
  if (holidayBody) { const res = await apiFetch('/api/admin/market/holidays'); const data = await parseJsonSafe(res); holidayBody.innerHTML = (data.holidays || []).map((h) => `<tr><td>${String(h.holiday_date).slice(0,10)}</td><td>${h.name}</td><td><button class="button danger" onclick="deleteHoliday('${String(h.holiday_date).slice(0,10)}')">Delete</button></td></tr>`).join('') || '<tr><td colspan="3">No holidays configured.</td></tr>'; }
}
async function deleteHoliday(date) { const res = await apiFetch(`/api/admin/market/holidays/${date}`, { method: 'DELETE' }); const data = await parseJsonSafe(res); if (!res.ok) return showAlert(data.error || data.message || 'Delete failed.', 'error'); showAlert('Holiday deleted.'); await loadMarketConfig(); }
window.deleteHoliday = deleteHoliday;

function handleRegisterForm() { const form = document.getElementById('registerForm'); if (!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const payload = Object.fromEntries(new FormData(form).entries()); const response = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }); const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Registration failed.', 'error'); localStorage.setItem('authToken', data.token); saveUser(data.user); window.location.href = 'user_home.html'; }); }
function handleLoginForm() { const form = document.getElementById('loginForm'); if (!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const payload = Object.fromEntries(new FormData(form).entries()); const response = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }); const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Login failed.', 'error'); localStorage.setItem('authToken', data.token); saveUser(data.user); window.location.href = data.user.role === 'ADMIN' ? 'admin_home.html' : 'user_home.html'; }); }
function handleCashForm(formId, endpoint, successText) { const form = document.getElementById(formId); if (!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const amount = Number(new FormData(form).get('amount')); const response = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ amount }) }); const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Request failed.', 'error'); showAlert(successText); form.reset(); await refreshSecureViews(); }); }
let cachedStocks = [];
function prefillEditStock(symbol) { const stock = cachedStocks.find((s) => s.symbol === symbol); if (!stock) return; document.getElementById('symbolInput').value = stock.symbol; document.getElementById('symbolInput').disabled = true; document.getElementById('companyInput').value = stock.company; document.getElementById('volumeInput').value = stock.volume; document.getElementById('priceInput').value = stock.price; document.getElementById('volatilityInput').value = stock.volatility || 0.02; document.getElementById('driftInput').value = stock.drift || 0.0001; document.getElementById('stockFormMode').value = 'edit'; }
window.prefillEditStock = prefillEditStock;
async function deleteStock(symbol) { if (!confirm(`Delete ${symbol}?`)) return; const response = await apiFetch(`/api/admin/stocks/${symbol}`, { method: 'DELETE' }); const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Delete failed.', 'error'); showAlert(data.message || 'Stock deleted.'); cachedStocks = await loadStocks(); }
window.deleteStock = deleteStock; window.submitTrade = submitTrade; window.logout = logout;
function handleAdminStockForm() { const form = document.getElementById('stockForm'); if (!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const mode = document.getElementById('stockFormMode').value; const payload = { symbol: document.getElementById('symbolInput').value, company: document.getElementById('companyInput').value, volume: Number(document.getElementById('volumeInput').value), price: Number(document.getElementById('priceInput').value), volatility: Number(document.getElementById('volatilityInput').value), drift: Number(document.getElementById('driftInput').value) }; const response = await apiFetch(mode === 'edit' ? `/api/admin/stocks/${payload.symbol}` : '/api/admin/stocks', { method: mode === 'edit' ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Unable to save stock.', 'error'); showAlert(data.message || 'Stock saved.'); form.reset(); document.getElementById('symbolInput').disabled = false; document.getElementById('stockFormMode').value = 'create'; cachedStocks = await loadStocks(); }); }
function handleHoursForm() { const form = document.getElementById('hoursForm'); if (!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const payload = Object.fromEntries(new FormData(form).entries()); payload.dayOfWeek = Number(payload.dayOfWeek); const response = await apiFetch('/api/admin/market/hours', { method: 'POST', body: JSON.stringify(payload) }); const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Unable to save hours.', 'error'); showAlert('Market hours saved.'); await loadMarketConfig(); }); }
function handleHolidayForm() { const form = document.getElementById('holidayForm'); if (!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const payload = Object.fromEntries(new FormData(form).entries()); const response = await apiFetch('/api/admin/market/holidays', { method: 'POST', body: JSON.stringify(payload) }); const data = await parseJsonSafe(response); if (!response.ok) return showAlert(data.error || data.message || 'Unable to save holiday.', 'error'); showAlert('Holiday saved.'); form.reset(); await loadMarketConfig(); }); }
function protectPage() { const protectedPage = document.body.dataset.protected === 'true'; const adminPage = document.body.dataset.adminOnly === 'true'; const user = getUser(); if (protectedPage && !user) { window.location.href = 'login.html'; return false; } if (adminPage && user?.role !== 'ADMIN') { window.location.href = 'user_home.html'; return false; } return true; }
async function refreshSecureViews() { if (document.getElementById('cashBalance')) await loadDashboard(); if (document.getElementById('portfolioTableBody')) await loadPortfolio(); if (document.getElementById('transactionsTableBody')) await loadTransactions(); if (document.getElementById('ordersTableBody')) await loadOrders(); if (document.getElementById('marketTableBody') || document.getElementById('adminTableBody')) cachedStocks = await loadStocks(); }
async function initializePage() { updateNavForRole(); if (!protectPage()) return; handleRegisterForm(); handleLoginForm(); handleCashForm('depositForm', '/api/wallet/deposit', 'Deposit completed.'); handleCashForm('withdrawForm', '/api/wallet/withdraw', 'Withdrawal completed.'); handleAdminStockForm(); handleHoursForm(); handleHolidayForm(); if (document.getElementById('marketTableBody') || document.getElementById('adminTableBody')) cachedStocks = await loadStocks(); if (document.getElementById('cashBalance')) await loadDashboard(); if (document.getElementById('portfolioTableBody')) await loadPortfolio(); if (document.getElementById('transactionsTableBody')) await loadTransactions(); if (document.getElementById('ordersTableBody')) await loadOrders(); if (document.getElementById('totalUsers')) await loadAdminStats(); if (document.getElementById('hoursList') || document.getElementById('holidayTableBody')) await loadMarketConfig(); }
document.addEventListener('DOMContentLoaded', initializePage);
