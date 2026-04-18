// =====================================================
// Stock Website Frontend Integration
// Wired to Ariana's backend (Node/Express + MySQL)
// Backend branch: BACKEND / stock-trading-backend-crom
// =====================================================

const API_ORIGIN = "http://35.153.95.86";

function apiUrl(path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}

function getAuthToken() {
  return localStorage.getItem("authToken") || null;
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem("authToken", token);
  }
}

function clearAuthToken() {
  localStorage.removeItem("authToken");
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers
  });

  return response;
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function requireElement(id) {
  return document.getElementById(id);
}

function normalizeStock(stock) {
  const price = Number(stock.price ?? stock.currentPrice ?? 0);
  const change = Number(stock.change ?? stock.priceChange ?? 0);
  const percentChange = Number(
    stock.percentChange ??
    stock.changePercent ??
    (price - change !== 0 ? (change / (price - change)) * 100 : 0)
  );

  return {
    symbol: stock.symbol || stock.ticker || "",
    ticker: stock.ticker || stock.symbol || "",
    company: stock.company || stock.name || "",
    name: stock.name || stock.company || "",
    sector: stock.sector || "",
    price,
    change,
    percentChange
  };
}

function normalizePortfolioEntry(item) {
  const sharesOwned = Number(item.sharesOwned ?? item.shares ?? item.quantity ?? 0);
  const pricePerShare = Number(item.pricePerShare ?? item.currentPrice ?? item.price ?? 0);
  const totalValue = Number(item.totalValue ?? item.value ?? sharesOwned * pricePerShare ?? 0);

  return {
    ticker: item.ticker || item.symbol || "",
    symbol: item.symbol || item.ticker || "",
    name: item.name || item.company || item.stockName || item.ticker || item.symbol || "",
    company: item.company || item.name || item.stockName || "",
    sharesOwned,
    pricePerShare,
    totalValue,
    value: totalValue
  };
}

function normalizeTransaction(tx) {
  return {
    date: tx.date || tx.createdAt?.slice?.(0, 10) || "",
    time: tx.time || tx.createdAt?.slice?.(11, 19) || "",
    stockName: tx.stockName || tx.name || tx.company || tx.ticker || tx.symbol || "",
    ticker: tx.ticker || tx.symbol || "",
    totalShares: Number(tx.totalShares ?? tx.shares ?? tx.quantity ?? 0),
    totalPrice: Number(tx.totalPrice ?? tx.amount ?? tx.value ?? 0),
    action: tx.action || tx.type || ""
  };
}

function getDashboardElements() {
  return {
    stockList: requireElement("stock-list"),
    tableBody: requireElement("stockTable")?.querySelector("tbody"),
    adminTableBody: requireElement("adminTableBody"),
    searchInput: requireElement("searchInput"),
    sectorFilter: requireElement("sectorFilter"),
    stockCount: requireElement("stockCount"),
    addStockForm: requireElement("addStockForm"),
    symbolInput: requireElement("symbolInput"),
    companyInput: requireElement("companyInput"),
    sectorInput: requireElement("sectorInput"),
    priceInput: requireElement("priceInput"),
    changeInput: requireElement("changeInput"),
    percentInput: requireElement("percentInput"),
    detailsPlaceholder: requireElement("detailsPlaceholder"),
    detailsCard: requireElement("stockDetails"),
    contactForm: requireElement("contact-form"),
    confirmationMessage: requireElement("confirmation-message")
  };
}

let elements = {};
let stocks = [];
let portfolioData = [];
let availableStocks = [];
let userPortfolio = [];
let userTransactions = [];
let filteredTransactions = [];
let marketHoursData = null;

const colorPalette = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
  "#9966FF", "#FF9F40", "#C9CBCF", "#8DD17E"
];

function updateStockCount() {
  if (elements.stockCount) {
    elements.stockCount.textContent = String(stocks.length);
  }
}

function renderPopularStocks() {
  if (!elements.stockList) return;

  elements.stockList.innerHTML = "";
  stocks.slice(0, 3).forEach((stock) => {
    const li = document.createElement("li");

    const leftSpan = document.createElement("span");
    leftSpan.className = "stock-symbol";
    leftSpan.textContent = `${stock.symbol} – ${stock.company}`;

    const rightSpan = document.createElement("span");
    rightSpan.className = "stock-price";
    rightSpan.textContent = `$${stock.price.toFixed(2)}`;

    li.appendChild(leftSpan);
    li.appendChild(rightSpan);
    elements.stockList.appendChild(li);
  });
}

async function showDetails(stock) {
  if (elements.detailsPlaceholder) {
    elements.detailsPlaceholder.classList.add("hidden");
  }
  if (elements.detailsCard) {
    elements.detailsCard.classList.remove("hidden");
  }

  const detailIds = {
    symbol: requireElement("detailSymbol"),
    company: requireElement("detailCompany"),
    sector: requireElement("detailSector"),
    price: requireElement("detailPrice"),
    change: requireElement("detailChange"),
    percent: requireElement("detailPercentChange")
  };

  if (detailIds.symbol) detailIds.symbol.textContent = stock.symbol;
  if (detailIds.company) detailIds.company.textContent = stock.company;
  if (detailIds.sector) detailIds.sector.textContent = stock.sector || "N/A";
  if (detailIds.price) detailIds.price.textContent = `$${stock.price.toFixed(2)}`;
  if (detailIds.change) detailIds.change.textContent = stock.change.toFixed(2);
  if (detailIds.percent) detailIds.percent.textContent = `${stock.percentChange.toFixed(2)}%`;

  const quote = await loadStockQuote(stock.ticker || stock.symbol);
  renderStockQuote(quote);
}

function renderTable(data = stocks) {
  if (!elements.tableBody) return;

  elements.tableBody.innerHTML = "";

  data.forEach((stock) => {
    const row = document.createElement("tr");
    row.addEventListener("click", () => showDetails(stock));

    const cells = [
      stock.symbol,
      stock.company,
      stock.sector,
      stock.price.toFixed(2),
      stock.change.toFixed(2),
      `${stock.percentChange.toFixed(2)}%`
    ];

    cells.forEach((content, index) => {
      const td = document.createElement("td");
      if (index >= 4) {
        const value = index === 4 ? stock.change : stock.percentChange;
        td.className = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
      }
      td.textContent = content;
      row.appendChild(td);
    });

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions-cell";
    actionsTd.innerHTML = `
      <button class="btn btn-buy" onclick="event.stopPropagation(); handleBuy('${stock.symbol}')">Buy</button>
      <button class="btn btn-sell" onclick="event.stopPropagation(); handleSell('${stock.symbol}')">Sell</button>
    `;
    row.appendChild(actionsTd);
    elements.tableBody.appendChild(row);
  });
}

function renderAdminTable(data = stocks) {
  if (!elements.adminTableBody) return;

  elements.adminTableBody.innerHTML = "";

  data.forEach((stock, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${stock.symbol}</strong></td>
      <td>${stock.company}</td>
      <td>${stock.sector}</td>
      <td>$${stock.price.toFixed(2)}</td>
      <td class="${stock.change > 0 ? "positive" : stock.change < 0 ? "negative" : "neutral"}">
        ${stock.change.toFixed(2)}
      </td>
      <td class="${stock.percentChange > 0 ? "positive" : stock.percentChange < 0 ? "negative" : "neutral"}">
        ${stock.percentChange.toFixed(2)}%
      </td>
      <td>
        <button class="btn-edit" onclick="editStock(${index})">Edit</button>
        <button class="btn-delete" onclick="deleteStock(${index})">Delete</button>
      </td>
    `;
    elements.adminTableBody.appendChild(row);
  });
}

function applyFilters() {
  const searchText = (elements.searchInput?.value || "").trim().toLowerCase();
  const sector = elements.sectorFilter?.value || "all";

  const filtered = stocks.filter((stock) => {
    const matchesSector = sector === "all" || stock.sector === sector;
    const matchesText = stock.symbol.toLowerCase().includes(searchText) || stock.company.toLowerCase().includes(searchText);
    return matchesSector && matchesText;
  });

  renderTable(filtered);
}

function handleBuy(symbol) {
  window.location.href = `user_buy_stocks.html?ticker=${encodeURIComponent(symbol)}`;
}

function handleSell(symbol) {
  window.location.href = `user_sell_stocks.html?ticker=${encodeURIComponent(symbol)}`;
}

async function loadStocks() {
  try {
    const response = await apiFetch("/api/stocks");
    if (!response.ok) throw new Error("Failed to load stocks");

    const rawStocks = await response.json();
    stocks = rawStocks.map(normalizeStock);

    renderTable(stocks);
    renderAdminTable(stocks);
    renderPopularStocks();
    updateStockCount();
  } catch (error) {
    console.error("Error loading stocks:", error);
    stocks = [];
    renderTable([]);
    renderAdminTable([]);
  }
}

function editStock(index) {
  const stock = stocks[index];
  if (!stock) return;

  if (elements.symbolInput) elements.symbolInput.value = stock.symbol;
  if (elements.companyInput) elements.companyInput.value = stock.company;
  if (elements.sectorInput) elements.sectorInput.value = stock.sector;
  if (elements.priceInput) elements.priceInput.value = stock.price;
  if (elements.changeInput) elements.changeInput.value = stock.change;
  if (elements.percentInput) elements.percentInput.value = stock.percentChange;

  if (elements.addStockForm) {
    const submitBtn = elements.addStockForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Update Stock";
    elements.addStockForm.dataset.editingTicker = stock.symbol;
  }
}

async function deleteStock(index) {
  const stock = stocks[index];
  if (!stock) return;
  if (!confirm(`Delete ${stock.symbol}?`)) return;

  try {
    const response = await apiFetch(`/api/admin/stocks/${encodeURIComponent(stock.symbol)}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Failed to delete stock");

    alert("Stock deleted.");
    await loadStocks();
  } catch (error) {
    console.error("Delete error:", error);
    alert("Error deleting stock.");
  }
}

function initAdminForm() {
  if (!elements.addStockForm) return;

  elements.addStockForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const symbol = elements.symbolInput?.value?.trim()?.toUpperCase();
    const company = elements.companyInput?.value?.trim();
    const sector = elements.sectorInput?.value?.trim();
    const price = Number(elements.priceInput?.value || 0);
    const change = Number(elements.changeInput?.value || 0);
    const percentChange = Number(elements.percentInput?.value || 0);
    const editingTicker = elements.addStockForm.dataset.editingTicker;

    if (!symbol || !company || !sector) {
      alert("Please fill in all stock fields.");
      return;
    }

    const payload = { ticker: symbol, name: company, sector, price, priceChange: change };

    try {
      const response = await apiFetch(
        editingTicker ? `/api/admin/stocks/${encodeURIComponent(editingTicker)}` : "/api/admin/stocks",
        {
          method: editingTicker ? "PATCH" : "POST",
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const err = await parseJsonSafely(response);
        throw new Error(err?.message || "Failed to save stock");
      }

      alert(editingTicker ? "Stock updated." : "Stock created.");
      elements.addStockForm.reset();
      delete elements.addStockForm.dataset.editingTicker;

      const submitBtn = elements.addStockForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = "Add Stock";

      await loadStocks();
    } catch (error) {
      console.error("Admin form error:", error);
      alert(error.message || "Error saving stock.");
    }
  });
}

function initContactForm() {
  if (!elements.contactForm || !elements.confirmationMessage) return;

  elements.contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    elements.contactForm.reset();
    elements.confirmationMessage.style.display = "block";
    setTimeout(() => {
      elements.confirmationMessage.style.display = "none";
    }, 5000);
  });
}

function updateCashBalance(amount) {
  const cashEl = requireElement("cashBalance");
  if (cashEl) {
    cashEl.textContent = Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

function updatePieLegend() {
  const legendEl = requireElement("pieLegend");
  if (!legendEl) return;

  legendEl.innerHTML = portfolioData.map((item, index) => `
    <div>
      <span class="legend-color" style="background: ${colorPalette[index % colorPalette.length]};"></span>
      ${item.ticker} ($${item.value.toLocaleString()})
    </div>
  `).join("");
}

function drawPieChart() {
  const canvas = requireElement("portfolioPie");
  if (!canvas || !portfolioData.length) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;
  const total = portfolioData.reduce((sum, item) => sum + item.value, 0);

  let startAngle = 0;
  portfolioData.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;

    ctx.fillStyle = colorPalette[index % colorPalette.length];
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    startAngle += sliceAngle;
  });
}

function updatePortfolioDisplay() {
  const titleEl = requireElement("portfolioTitle");
  const pieLegendEl = document.querySelector(".pie-legend") || requireElement("pieLegend");
  if (!titleEl) return;

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  if (!portfolioData.length || totalValue === 0) {
    titleEl.textContent = "Portfolio Allocation (No holdings)";
    if (pieLegendEl) pieLegendEl.innerHTML = "<div>No stocks held</div>";
    return;
  }

  titleEl.textContent = `Portfolio Allocation (Total Value: $${totalValue.toLocaleString()})`;
  updatePieLegend();
  drawPieChart();
}

async function loadUserData() {
  const portfolioTitle = requireElement("portfolioTitle");
  if (!portfolioTitle) return;

  try {
    const response = await apiFetch("/api/trades/portfolio");
    if (!response.ok) throw new Error("Failed to load portfolio");

    const data = await response.json();
    const holdings = Array.isArray(data) ? data : (data.portfolio || data.holdings || []);
    const cashBalance = data.cashBalance ?? data.cash ?? data.availableCash ?? 0;

    portfolioData = holdings.map(normalizePortfolioEntry);
    updateCashBalance(cashBalance);
    updatePortfolioDisplay();
  } catch (error) {
    console.error("Error loading dashboard:", error);
    portfolioTitle.textContent = "Error loading portfolio";
  }
}

function refreshDashboard() {
  loadUserData();
}
window.refreshUserDashboard = refreshDashboard;

async function loadAvailableStocks() {
  const tbody = requireElement("stocksTableBody");
  if (!tbody) return;

  try {
    const response = await apiFetch("/api/stocks");
    if (!response.ok) throw new Error("Failed to load stocks");

    availableStocks = (await response.json()).map(normalizeStock);
    populateStocksTable();
  } catch (error) {
    console.error("Error loading stocks:", error);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#dc2626;">Error loading stocks</td></tr>';
  }
}

function populateStocksTable(stocksToShow = availableStocks) {
  const tbody = requireElement("stocksTableBody");
  if (!tbody) return;

  if (!stocksToShow.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No stocks available</td></tr>';
    return;
  }

  tbody.innerHTML = stocksToShow.map((stock) => `
    <tr>
      <td>${stock.company}</td>
      <td><strong>${stock.symbol}</strong></td>
      <td>${stock.sector}</td>
      <td class="price">$${stock.price.toLocaleString()}</td>
      <td class="${stock.change >= 0 ? "positive" : "negative"}">
        ${stock.change >= 0 ? "+" : ""}$${Math.abs(stock.change).toLocaleString()}
      </td>
      <td class="${stock.percentChange >= 0 ? "positive" : "negative"}">
        ${stock.percentChange >= 0 ? "+" : ""}${stock.percentChange.toFixed(2)}%
      </td>
      <td class="actions-cell">
        <a href="user_buy_stocks.html?ticker=${encodeURIComponent(stock.symbol)}" class="btn-buy">Buy</a>
      </td>
    </tr>
  `).join("");
}

async function loadUserPortfolio() {
  const tbody = requireElement("portfolioTableBody");
  if (!tbody) return;

  try {
    const response = await apiFetch("/api/trades/portfolio");
    if (!response.ok) throw new Error("Failed to load portfolio");

    const data = await response.json();
    const holdings = Array.isArray(data) ? data : (data.portfolio || data.holdings || []);
    userPortfolio = holdings.map(normalizePortfolioEntry);
    populatePortfolioTable();
  } catch (error) {
    console.error("Error loading portfolio:", error);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#dc2626;">Error loading portfolio</td></tr>';
  }
}

function populatePortfolioTable() {
  const tbody = requireElement("portfolioTableBody");
  const totalValueEl = requireElement("totalPortfolioValue");
  if (!tbody) return;

  if (!userPortfolio.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No stocks owned</td></tr>';
    if (totalValueEl) totalValueEl.textContent = "$0.00";
    return;
  }

  const totalPortfolioValue = userPortfolio.reduce((sum, holding) => sum + holding.totalValue, 0);
  if (totalValueEl) {
    totalValueEl.textContent = `$${totalPortfolioValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  tbody.innerHTML = userPortfolio.map((holding) => `
    <tr>
      <td>${holding.name}</td>
      <td><strong>${holding.ticker}</strong></td>
      <td class="price">$${holding.pricePerShare.toLocaleString()}</td>
      <td><strong>${holding.sharesOwned.toLocaleString()}</strong></td>
      <td class="price">$${holding.totalValue.toLocaleString()}</td>
      <td class="actions-cell">
        <a href="user_sell_stocks.html?ticker=${encodeURIComponent(holding.ticker)}&shares=${holding.sharesOwned}" class="btn-sell">Sell</a>
      </td>
    </tr>
  `).join("");
}

async function loadUserPortfolioForSell() {
  const select = requireElement("stockSelect");
  if (!select) return;

  try {
    const response = await apiFetch("/api/trades/portfolio");
    if (!response.ok) throw new Error("Failed to load portfolio");

    const data = await response.json();
    const holdings = Array.isArray(data) ? data : (data.portfolio || data.holdings || []);
    userPortfolio = holdings.map(normalizePortfolioEntry);
    populateStockSelect();
  } catch (error) {
    console.error("Error loading sell portfolio:", error);
    select.innerHTML = "<option>Error loading portfolio</option>";
  }
}

function populateStockSelect() {
  const select = requireElement("stockSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Choose a stock...</option>';

  userPortfolio.forEach((stock) => {
    select.innerHTML += `
      <option value="${stock.ticker}" data-shares="${stock.sharesOwned}" data-price="${stock.pricePerShare}">
        ${stock.name} (${stock.ticker}) - ${stock.sharesOwned} shares
      </option>
    `;
  });
}

function validateSellInput(ticker, sharesToSell) {
  const sharesError = requireElement("sharesError");
  const selectedOption = document.querySelector(`#stockSelect option[value="${ticker}"]`);
  if (!selectedOption) return false;

  const sharesOwned = Number(selectedOption.dataset.shares || 0);

  if (!ticker) {
    if (sharesError) {
      sharesError.textContent = "Please select a stock";
      sharesError.style.display = "block";
    }
    return false;
  }

  if (!sharesToSell || sharesToSell <= 0) {
    if (sharesError) {
      sharesError.textContent = "Enter a valid number of shares";
      sharesError.style.display = "block";
    }
    return false;
  }

  if (sharesToSell > sharesOwned) {
    if (sharesError) {
      sharesError.textContent = `You only own ${sharesOwned} shares`;
      sharesError.style.display = "block";
    }
    return false;
  }

  if (sharesError) sharesError.style.display = "none";
  return true;
}

function showConfirmModal(ticker, sharesToSell, pricePerShare, totalSellValue) {
  const confirmDetails = requireElement("confirmDetails");
  const modal = requireElement("confirmModal");
  const selectedOption = document.querySelector(`#stockSelect option[value="${ticker}"]`);
  if (!confirmDetails || !modal || !selectedOption) return;

  const stockName = selectedOption.textContent.split(" (")[0];
  confirmDetails.innerHTML = `
    <div><span class="label">Stock:</span><span class="value">${stockName}</span></div>
    <div><span class="label">Ticker:</span><span class="value">${ticker}</span></div>
    <div><span class="label">Shares to Sell:</span><span class="value">${sharesToSell.toLocaleString()}</span></div>
    <div><span class="label">Price per Share:</span><span class="value">$${pricePerShare.toLocaleString()}</span></div>
    <div style="border-top:2px solid #e5e7eb; padding-top:12px; margin-top:12px;">
      <span class="label">Total Sell Value:</span>
      <span class="value positive">$${totalSellValue.toLocaleString()}</span>
    </div>
  `;
  modal.style.display = "flex";
}

async function loadUserTransactions() {
  const tbody = requireElement("transactionsTableBody");
  if (!tbody) return;

  try {
    const response = await apiFetch("/api/trades/transactions");
    if (!response.ok) throw new Error("Failed to load transactions");

    userTransactions = (await response.json()).map(normalizeTransaction);
    filteredTransactions = [...userTransactions];
    applySort();
    renderTransactionsTable();
  } catch (error) {
    console.error("Error loading transactions:", error);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#dc2626;">Error loading transactions</td></tr>';
  }
}

function applySearch() {
  const searchInput = requireElement("transactionSearch");
  const query = (searchInput?.value || "").trim().toLowerCase();

  if (!query) {
    filteredTransactions = [...userTransactions];
  } else {
    filteredTransactions = userTransactions.filter((tx) => {
      return tx.stockName.toLowerCase().includes(query) || tx.ticker.toLowerCase().includes(query);
    });
  }

  applySort();
  renderTransactionsTable();
}

function applySort() {
  const sortSelect = requireElement("sortOrder");
  const order = sortSelect?.value || "newest";

  filteredTransactions.sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.time || "00:00:00"}`);
    const bDate = new Date(`${b.date}T${b.time || "00:00:00"}`);
    return order === "oldest" ? aDate - bDate : bDate - aDate;
  });
}

function renderTransactionsTable() {
  const tbody = requireElement("transactionsTableBody");
  const emptyMsg = requireElement("transactionsEmptyMessage");
  if (!tbody) return;

  if (!filteredTransactions.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No transactions found</td></tr>';
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  tbody.innerHTML = filteredTransactions.map((tx) => {
    const actionUpper = tx.action.toUpperCase();
    const isBuy = actionUpper === "BUY" || actionUpper === "BOUGHT";
    const actionClass = isBuy ? "action-buy" : "action-sell";

    return `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.time}</td>
        <td>${tx.stockName}</td>
        <td><strong>${tx.ticker}</strong></td>
        <td>${tx.totalShares.toLocaleString()}</td>
        <td class="price">$${tx.totalPrice.toLocaleString()}</td>
        <td class="${actionClass}">${isBuy ? "Bought" : "Sold"}</td>
      </tr>
    `;
  }).join("");
}

async function loadAdminHomeStocks() {
  const tbody = requireElement("adminHomeStockTableBody");
  if (!tbody) return;

  try {
    const response = await apiFetch("/api/stocks");
    if (!response.ok) throw new Error("Failed to load stocks");

    const allStocks = (await response.json()).map(normalizeStock);
    const limited = allStocks.slice(0, 15);

    if (!limited.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No stocks available</td></tr>';
      return;
    }

    tbody.innerHTML = limited.map((stock) => `
      <tr>
        <td><strong>${stock.symbol}</strong></td>
        <td>${stock.company}</td>
        <td>${stock.sector}</td>
        <td class="price">$${stock.price.toLocaleString()}</td>
        <td class="${stock.change >= 0 ? "positive" : "negative"}">
          ${stock.change >= 0 ? "+" : ""}$${Math.abs(stock.change).toLocaleString()}
        </td>
        <td class="${stock.percentChange >= 0 ? "positive" : "negative"}">
          ${stock.percentChange >= 0 ? "+" : ""}${stock.percentChange.toFixed(2)}%
        </td>
        <td class="actions-cell">
          <a href="admin_edit_stocks.html?ticker=${encodeURIComponent(stock.symbol)}" class="btn-edit">Edit</a>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    console.error("Error loading admin stocks:", error);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#dc2626;">Error loading stocks</td></tr>';
  }
}

async function loadMarketHours() {
  try {
    const response = await apiFetch("/api/admin/market/hours");
    if (!response.ok) throw new Error("Failed to load market hours");

    marketHoursData = await response.json();
    renderMarketHoursTable();
    renderHolidayHoursList();
    renderMarketCalendar();
  } catch (error) {
    console.error("Error loading market hours:", error);
  }
}

function formatTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = String(hhmm).split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function renderMarketHoursTable() {
  const container = requireElement("marketHoursTable");
  if (!container || !marketHoursData?.weeklyHours) return;

  container.innerHTML = marketHoursData.weeklyHours.map((entry) => {
    const isClosed = !entry.open || !entry.close;
    const hoursText = isClosed ? "Closed" : `${formatTime(entry.open)} – ${formatTime(entry.close)}`;
    return `<div class="hours-row"><span>${entry.day}</span><span>${hoursText}</span></div>`;
  }).join("");
}

function renderHolidayHoursList() {
  const container = requireElement("holidayHoursList");
  if (!container) return;

  const holidays = marketHoursData?.holidays || [];
  if (!holidays.length) {
    container.innerHTML = '<p class="note">No holiday hours configured.</p>';
    return;
  }

  container.innerHTML = holidays.map((h) => {
    const date = new Date(h.date);
    const labelDate = date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

    let desc = h.hours || "Hours set";
    if (h.type === "closed") desc = "Closed";
    if (h.type === "short") desc = h.hours || "Short day";

    return `<div class="hours-row"><span>${labelDate}</span><span>${desc}${h.label ? ` (${h.label})` : ""}</span></div>`;
  }).join("");
}

function renderMarketCalendar() {
  const calendarEl = requireElement("marketCalendar");
  const monthLabelEl = requireElement("calendarMonthLabel");
  if (!calendarEl || !monthLabelEl) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  monthLabelEl.textContent = `${monthNames[month]} ${year}`;
  calendarEl.innerHTML = "";

  dayNames.forEach((d) => {
    const el = document.createElement("div");
    el.className = "day-label";
    el.textContent = d;
    calendarEl.appendChild(el);
  });

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const holidays = (marketHoursData?.holidays || []).filter((h) => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const holidayMap = {};
  holidays.forEach((h) => {
    holidayMap[new Date(h.date).getDate()] = h;
  });

  for (let i = 0; i < startWeekday; i += 1) {
    const empty = document.createElement("div");
    empty.className = "day-cell";
    calendarEl.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.textContent = String(day);

    const holiday = holidayMap[day];
    if (holiday) {
      if (holiday.type === "closed") cell.classList.add("closed");
      if (holiday.type === "short") cell.classList.add("short");
      cell.title = holiday.label || "";
    }

    calendarEl.appendChild(cell);
  }
}

function initRegisterPage() {
  const registerForm = requireElement("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = requireElement("fullName")?.value?.trim();
    const email = requireElement("email")?.value?.trim();
    const password = requireElement("password")?.value || "";

    if (!fullName || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await parseJsonSafely(response);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Registration failed");
      }

      alert("Account created successfully. Please log in.");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message || "Registration failed.");
    }
  });
}

function initLoginPage() {
  const loginForm = requireElement("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = requireElement("email")?.value?.trim() || requireElement("username")?.value?.trim();
    const password = requireElement("password")?.value || "";

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const data = await parseJsonSafely(response);
      if (!response.ok) {
        throw new Error(data?.message || "Login failed. Check your credentials.");
      }

      setAuthToken(data?.token);

      if (data?.user?.role === "ADMIN" || data?.user?.role === "admin") {
        window.location.href = "admin_home.html";
      } else {
        window.location.href = "user_home.html";
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message || "Login failed.");
    }
  });
}

function initStocksFilterPage() {
  const stockFilter = requireElement("stockFilter");
  if (!stockFilter) return;

  stockFilter.addEventListener("change", function onChange() {
    const filter = this.value;
    const filtered = filter === "all"
      ? availableStocks
      : availableStocks.filter((stock) => stock.sector.toLowerCase().includes(filter.toLowerCase()));
    populateStocksTable(filtered);
  });
}

function initSellPage() {
  const stockSelect = requireElement("stockSelect");
  const sellForm = requireElement("sellForm");
  const cancelSellBtn = requireElement("cancelSellBtn");
  const confirmSellBtn = requireElement("confirmSellBtn");

  if (stockSelect) {
    stockSelect.addEventListener("change", function onSelectChange() {
      const selectedOption = this.options[this.selectedIndex];
      const sharesOwned = Number(selectedOption?.dataset?.shares || 0);
      const pricePerShare = Number(selectedOption?.dataset?.price || 0);
      const stockInfo = requireElement("stockInfo");
      const sharesInput = requireElement("sharesToSell");
      const sharesError = requireElement("sharesError");

      if (this.value && stockInfo) {
        stockInfo.textContent = `${selectedOption.textContent} | Current Price: $${pricePerShare.toLocaleString()}`;
      } else if (stockInfo) {
        stockInfo.textContent = "";
      }

      if (sharesInput) {
        sharesInput.max = String(sharesOwned);
        sharesInput.value = "";
      }
      if (sharesError) sharesError.style.display = "none";
    });
  }

  if (sellForm) {
    sellForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const ticker = requireElement("stockSelect")?.value || "";
      const sharesToSell = Number(requireElement("sharesToSell")?.value || 0);
      if (!validateSellInput(ticker, sharesToSell)) return;

      const selectedOption = document.querySelector(`#stockSelect option[value="${ticker}"]`);
      const pricePerShare = Number(selectedOption?.dataset?.price || 0);
      const totalSellValue = sharesToSell * pricePerShare;
      showConfirmModal(ticker, sharesToSell, pricePerShare, totalSellValue);
    });
  }

  if (cancelSellBtn) {
    cancelSellBtn.addEventListener("click", () => {
      const modal = requireElement("confirmModal");
      if (modal) modal.style.display = "none";
    });
  }

  if (confirmSellBtn) {
    confirmSellBtn.addEventListener("click", async () => {
      const ticker = requireElement("stockSelect")?.value || "";
      const shares = Number(requireElement("sharesToSell")?.value || 0);

      try {
        const response = await apiFetch("/api/trades/sell", {
          method: "POST",
          body: JSON.stringify({ ticker, shares })
        });

        const data = await parseJsonSafely(response);
        if (!response.ok) {
          throw new Error(data?.message || "Sell failed.");
        }

        alert("Sell order confirmed.");
        const modal = requireElement("confirmModal");
        if (modal) modal.style.display = "none";
        sellForm?.reset();
        await loadUserPortfolioForSell();
        refreshDashboard();
      } catch (error) {
        console.error("Sell error:", error);
        alert(error.message || "Error processing sell order.");
      }
    });
  }
}

function initTransactionsPage() {
  if (!requireElement("transactionsTable")) return;

  loadUserTransactions();

  const searchBtn = requireElement("transactionSearchBtn");
  const searchInput = requireElement("transactionSearch");
  const sortSelect = requireElement("sortOrder");

  if (searchBtn) searchBtn.addEventListener("click", applySearch);
  if (searchInput) {
    searchInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") applySearch();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      applySort();
      renderTransactionsTable();
    });
  }
}

function initLogoutLinks() {
  document.querySelectorAll('[data-action="logout"]').forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      clearAuthToken();
      window.location.href = "login.html";
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  elements = getDashboardElements();

  initRegisterPage();
  initLoginPage();
  initContactForm();
  initAdminForm();
  initStocksFilterPage();
  initSellPage();
  initTransactionsPage();
  initLogoutLinks();

  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", applyFilters);
  }

  await loadStocks();
  await loadUserData();
  await loadAvailableStocks();
  await loadUserPortfolio();
  await loadUserPortfolioForSell();
  await loadAdminHomeStocks();
  await loadMarketHours();
});

/*
Added code to call the random generator
*/

async function loadStockQuote(ticker) {
  try {
    const response = await apiFetch(`/api/stocks/${encodeURIComponent(ticker)}/quote`);
    if (!response.ok) throw new Error("Failed to load quote");
    return await response.json();
  } catch (error) {
    console.error("Quote load error:", error);
    return null;
  }
}

function renderStockQuote(quote) {
  const priceEl = document.getElementById("quotePrice");
  const changeEl = document.getElementById("quoteChange");
  const percentEl = document.getElementById("quotePercent");

  if (priceEl) priceEl.textContent = quote?.price ?? quote?.currentPrice ?? "N/A";
  if (changeEl) changeEl.textContent = quote?.change ?? quote?.priceChange ?? "N/A";
  if (percentEl) percentEl.textContent = quote?.percentChange ?? "N/A";
}