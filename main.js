// ==============================
// CENTRAL STOCKS ARRAY - This is what both Market and Admin use
// ==============================
let stocks = [];
let authToken = localStorage.getItem('authToken') || null;

// ==============================
// RENDER POPULAR STOCKS (for home page)
// ==============================
function renderPopularStocks() {
    if (!elements.stockList) return;
    elements.stockList.innerHTML = "";
    const topStocks = stocks.slice(0, 3);
    topStocks.forEach(stock => {
        const li = document.createElement("li");
        const leftSpan = document.createElement("span");
        leftSpan.className = "stock-symbol";
        leftSpan.textContent = `${stock.symbol || stock.ticker} – ${stock.company || stock.name}`;
        const rightSpan = document.createElement("span");
        rightSpan.className = "stock-price";
        rightSpan.textContent = `$${(stock.price || 0).toFixed(2)}`;
        li.appendChild(leftSpan);
        li.appendChild(rightSpan);
        elements.stockList.appendChild(li);
    });
}


// ==============================
// RENDER MARKET TABLE (for market.html)
// ==============================
function renderTable(data = stocks) {
    if (!elements.tableBody) return;
    
    elements.tableBody.innerHTML = "";
    
    data.forEach((stock) => {
        const row = document.createElement("tr");
        row.addEventListener("click", () => showDetails(stock));
        
        // Create all cells (same as before)
        const cells = [
            stock.symbol,
            stock.company,
            stock.sector,
            stock.price.toFixed(2),
            stock.change.toFixed(2),
            (stock.percentChange.toFixed(2) + "%")
        ];
        
        cells.forEach((content, i) => {
            const td = document.createElement("td");
            if (i >= 4) { // change/percent columns
                const value = i === 4 ? stock.change : stock.percentChange;
                td.className = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
            }
            td.textContent = content;
            row.appendChild(td);
        });
        
        // Actions
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

// ==============================
// RENDER ADMIN TABLE
// ==============================
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
            <td class="${stock.change > 0 ? 'positive' : stock.change < 0 ? 'negative' : 'neutral'}">
                ${stock.change.toFixed(2)}
            </td>
            <td class="${stock.percentChange > 0 ? 'positive' : stock.percentChange < 0 ? 'negative' : 'neutral'}">
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

// ==============================
// ADMIN FUNCTIONS
// ==============================
function updateStockCount() {
    if (elements.stockCount) {
        elements.stockCount.textContent = stocks.length;
    }
}

async function deleteStock(index) {
    if (confirm(`Delete ${stocks[index].symbol}?`)) {
        try {
            const response = await fetch(`/api/admin/stocks/${stocks[index].symbol}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 
                          ...(authToken && { 'Authorization': `Bearer ${authToken}` }) }
            });
            if (!response.ok) throw new Error('Failed to delete');
            await loadStocks();
            alert("Stock deleted!");
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting stock.');
        }
    }
}


function editStock(index) {
    const stock = stocks[index];
    if (elements.symbolInput) elements.symbolInput.value = stock.symbol;
    if (elements.companyInput) elements.companyInput.value = stock.company;
    if (elements.sectorInput) elements.sectorInput.value = stock.sector;
    if (elements.priceInput) elements.priceInput.value = stock.price;
    if (elements.changeInput) elements.changeInput.value = stock.change;
    if (elements.percentInput) elements.percentInput.value = stock.percentChange;
    
    if (elements.addStockForm) {
        elements.addStockForm.querySelector('button[type="submit"]').textContent = "Update Stock";
        elements.addStockForm.dataset.editingIndex = index;
    }
}

async function initAdminForm() {
    if (!elements.addStockForm) return;
    elements.addStockForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const editingIndex = elements.addStockForm.dataset.editingIndex;
        if (!elements.symbolInput?.value || !elements.companyInput?.value || 
            !elements.sectorInput?.value || !elements.priceInput?.value || 
            !elements.changeInput?.value || !elements.percentInput?.value) {
            alert("Please fill in all fields.");
            return;
        }
        const stockData = {
            symbol: elements.symbolInput.value.toUpperCase(),
            company: elements.companyInput.value,
            sector: elements.sectorInput.value,
            price: parseFloat(elements.priceInput.value),
            change: parseFloat(elements.changeInput.value),
            percentChange: parseFloat(elements.percentInput.value)
        };
        try {
            if (editingIndex !== undefined) {
                const response = await fetch(`/api/admin/stocks/${stockData.symbol}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 
                              ...(authToken && { 'Authorization': `Bearer ${authToken}` }) },
                    body: JSON.stringify(stockData)
                });
                if (!response.ok) throw new Error('Failed to update');
                alert("Stock updated!");
            } else {
                const response = await fetch('/api/admin/stocks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 
                              ...(authToken && { 'Authorization': `Bearer ${authToken}` }) },
                    body: JSON.stringify(stockData)
                });
                if (!response.ok) throw new Error('Failed to create');
                alert("Stock added!");
            }
            await loadStocks();
            elements.addStockForm.reset();
            elements.addStockForm.querySelector('button[type="submit"]').textContent = "Add Stock";
            delete elements.addStockForm.dataset.editingIndex;
        } catch (error) {
            console.error('Admin form error:', error);
            alert('Error saving stock.');
        }
    });
}


// ==============================
// MARKET PAGE FUNCTIONS (search/filter)
// ==============================
function applyFilters() {
    const searchText = (elements.searchInput?.value || "").trim().toLowerCase();
    const sector = elements.sectorFilter?.value || "all";
    
    const filtered = stocks.filter(stock => 
        (sector === "all" || stock.sector === sector) &&
        (stock.symbol.toLowerCase().includes(searchText) || 
         stock.company.toLowerCase().includes(searchText))
    );
    
    renderTable(filtered);
}

function handleBuy(symbol) { alert(`Buy order for ${symbol}`); }
function handleSell(symbol) { alert(`Sell order for ${symbol}`); }
function showDetails(stock) {
    // Details panel logic for market page
    if (elements.detailsPlaceholder) elements.detailsPlaceholder.classList.add("hidden");
    if (elements.detailsCard) elements.detailsCard.classList.remove("hidden");
}

// ==============================
// CONTACT FORM
// ==============================
function initContactForm() {
    if (!elements.contactForm || !elements.confirmationMessage) return;
    
    elements.contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        elements.contactForm.reset();
        elements.confirmationMessage.style.display = "block";
        setTimeout(() => elements.confirmationMessage.style.display = "none", 5000);
    });
}

// ==============================
// SINGLE INITIALIZATION - Everything starts here
// ==============================
// ADD THIS NEW FUNCTION BEFORE THE DOMContentLoaded block
async function loadStocks() {
    try {
        const response = await fetch('/api/stocks');
        if (!response.ok) throw new Error('Failed to load stocks');
        const rawStocks = await response.json();
        stocks = rawStocks.map(stock => ({
            symbol: stock.symbol || stock.ticker,
            company: stock.company || stock.name,
            sector: stock.sector,
            price: stock.price || stock.currentPrice || 0,
            change: stock.change || stock.priceChange || 0,
            percentChange: stock.percentChange || stock.changePercent || 0
        }));
        renderTable(stocks);
        renderAdminTable(stocks);
        renderPopularStocks();
    } catch (error) {
        console.error('Error loading stocks:', error);
        stocks = [];
        renderTable([]);
        renderAdminTable([]);
    }
}

// ==============================
// Remove ALL elements definition and functions until line 176
// REPLACE with this SINGLE block:
document.addEventListener("DOMContentLoaded", async () => {
    // Define elements AFTER DOM loads
    window.elements = {
        tableBody: document.getElementById("stockTable")?.querySelector("tbody"),
        adminTableBody: document.getElementById("adminTableBody"),
        searchInput: document.getElementById("searchInput"),
        sectorFilter: document.getElementById("sectorFilter"),
        adminSearch: document.getElementById("adminSearch"),
        stockCount: document.getElementById("stockCount"),
        clearAllBtn: document.getElementById("clearAllBtn"),
        addStockForm: document.getElementById("addStockForm"),
        symbolInput: document.getElementById("symbolInput"),
        companyInput: document.getElementById("companyInput"),
        sectorInput: document.getElementById("sectorInput"),
        priceInput: document.getElementById("priceInput"),
        changeInput: document.getElementById("changeInput"),
        percentInput: document.getElementById("percentInput"),
        detailsPlaceholder: document.getElementById("detailsPlaceholder"),
        detailsCard: document.getElementById("stockDetails"),
        stockList: document.getElementById("stock-list"),
        contactForm: document.getElementById("contact-form"),
        confirmationMessage: document.getElementById("confirmation-message")
    };

    await loadStocks();
    updateStockCount();
    
    // All your render functions here (they now work because elements exist)
    renderPopularStocks();
    if (elements.tableBody) renderTable(stocks);
    if (elements.adminTableBody) renderAdminTable(stocks);
    initAdminForm();
    initContactForm();
    
    // Event listeners
    if (elements.searchInput) elements.searchInput.addEventListener("input", applyFilters);
    // ... rest unchanged
});


// ==============================
// User Home Page JavaScript
// ==============================
// User Home Page - Dynamic Portfolio & Cash

let portfolioData = []; // Will be populated from backend

// Color palette for pie slices
const colorPalette = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
  '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
];

async function loadUserData() {
  try {
    // Fetch portfolio and cash from your backend API
    const response = await fetch('/api/user/dashboard');
    
    if (!response.ok) {
      throw new Error('Failed to load dashboard data');
    }
    
    const data = await response.json();
    
    // Expected backend response format:
    // {
    //   cashBalance: 25000,
    //   portfolio: [
    //     { symbol: 'AAPL', value: 5000 },
    //     { symbol: 'TSLA', value: 3000 },
    //     { symbol: 'GOOGL', value: 2000 }
    //   ]
    // }
    
    portfolioData = data.portfolio || [];
    updateCashBalance(data.cashBalance || 0);
    updatePortfolioDisplay();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    document.getElementById('portfolioTitle').textContent = 'Error loading portfolio';
  }
}

function updateCashBalance(amount) {
  const cashEl = document.getElementById('cashBalance');
  cashEl.textContent = amount.toLocaleString();
}

function updatePortfolioDisplay() {
  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
  const titleEl = document.getElementById('portfolioTitle');
  
  if (totalValue === 0) {
    titleEl.textContent = 'Portfolio Allocation (No holdings)';
    document.querySelector('.pie-legend').innerHTML = '<div>No stocks held</div>';
    return;
  }
  
  titleEl.textContent = `Portfolio Allocation (Total Value: $${totalValue.toLocaleString()})`;
  updatePieLegend();
  drawPieChart();
}

function updatePieLegend() {
  const legendEl = document.getElementById('pieLegend');
  legendEl.innerHTML = portfolioData.map((item, index) => 
    `<div><span class="legend-color" style="background: ${colorPalette[index % colorPalette.length]};"></span>${item.symbol} ($${item.value.toLocaleString()})</div>`
  ).join('');
}

function drawPieChart() {
  const canvas = document.getElementById('portfolioPie');
  if (!canvas || portfolioData.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;

  const total = portfolioData.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;

  portfolioData.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const color = colorPalette[index % colorPalette.length];
    
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    startAngle += sliceAngle;
  });
}

// Auto-refresh every 30 seconds (or call manually after buy/sell)
function refreshDashboard() {
  loadUserData();
}

// Global function for other pages to trigger refresh (e.g. after buy/sell)
window.refreshUserDashboard = refreshDashboard;

// ==============================
// User Buy Stock Market Page
// ==============================
let availableStocks = [];

async function loadAvailableStocks() {
  try {
    const response = await fetch('/api/stocks');
    
    if (!response.ok) throw new Error('Failed to load stocks');
    
    availableStocks = await response.json();
    populateStocksTable();
    
  } catch (error) {
    console.error('Error loading stocks:', error);
    document.getElementById('stocksTableBody').innerHTML = 
      '<tr><td colspan="7" style="text-align: center; color: #dc2626;">Error loading stocks</td></tr>';
  }
}

function populateStocksTable(stocksToShow = availableStocks) {
  const tbody = document.getElementById('stocksTableBody');
  
  if (stocksToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No stocks available</td></tr>';
    return;
  }
  
  tbody.innerHTML = stocksToShow.map(stock => {
    const isPositive = stock.priceChange >= 0;
    const changePercent = ((stock.priceChange / (stock.price - stock.priceChange)) * 100).toFixed(2);
    
    return `
      <tr>
        <td>${stock.name}</td>
        <td><strong>${stock.ticker}</strong></td>
        <td>${stock.sector}</td>
        <td class="price">$${stock.price.toLocaleString()}</td>
        <td class="${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '+' : ''}$${Math.abs(stock.priceChange).toLocaleString()}
        </td>
        <td class="${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '+' : ''}${changePercent}%
        </td>
        <td class="actions-cell">
          <a href="user_buy_stocks.html?ticker=${stock.ticker}" class="btn-buy">Buy</a>
        </td>
      </tr>
    `;
  }).join('');
}

// Sector filter (bonus feature using your existing controls)
document.getElementById('stockFilter')?.addEventListener('change', function() {
  const filter = this.value;
  const filteredStocks = filter === 'all' 
    ? availableStocks 
    : availableStocks.filter(stock => stock.sector.toLowerCase().includes(filter));
  populateStocksTable(filteredStocks);
});

// ==============================
// User Portfolio Page Function
// ==============================
let userPortfolio = [];

async function loadUserPortfolio() {
  try {
    const response = await fetch('/api/user/portfolio');
    
    if (!response.ok) throw new Error('Failed to load portfolio');
    
    userPortfolio = await response.json();
    populatePortfolioTable();
    
  } catch (error) {
    console.error('Error loading portfolio:', error);
    document.getElementById('portfolioTableBody').innerHTML = 
      '<tr><td colspan="6" style="text-align: center; color: #dc2626;">Error loading portfolio</td></tr>';
  }
}

function populatePortfolioTable() {
  const tbody = document.getElementById('portfolioTableBody');
  const totalValueEl = document.getElementById('totalPortfolioValue');
  
  if (userPortfolio.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No stocks owned</td></tr>';
    totalValueEl.textContent = '$0.00';
    return;
  }
  
  const totalPortfolioValue = userPortfolio.reduce((sum, holding) => sum + holding.totalValue, 0);
  totalValueEl.textContent = `$${totalPortfolioValue.toLocaleString()}`;
  
  tbody.innerHTML = userPortfolio.map(holding => {
    return `
      <tr>
        <td>${holding.name}</td>
        <td><strong>${holding.ticker}</strong></td>
        <td class="price">$${holding.pricePerShare.toLocaleString()}</td>
        <td><strong>${holding.sharesOwned.toLocaleString()}</strong></td>
        <td class="price">$${holding.totalValue.toLocaleString()}</td>
        <td class="actions-cell">
          <a href="user_sell_stock.html?ticker=${holding.ticker}&shares=${holding.sharesOwned}" class="btn-sell">Sell</a>
        </td>
      </tr>
    `;
  }).join('');
}

// ==============================
// Sell Stocks Page Function
// ==============================

async function loadUserPortfolioForSell() {
  try {
    const response = await fetch('/api/user/portfolio');
    if (!response.ok) throw new Error('Failed to load portfolio');
    
    userPortfolio = await response.json();
    populateStockSelect();
    
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('stockSelect').innerHTML = '<option>Error loading portfolio</option>';
  }
}

function populateStockSelect() {
  const select = document.getElementById('stockSelect');
  select.innerHTML = '<option value="">Choose a stock...</option>';
  
  userPortfolio.forEach(stock => {
    select.innerHTML += `<option value="${stock.ticker}" data-shares="${stock.sharesOwned}" data-price="${stock.pricePerShare}">
      ${stock.name} (${stock.ticker}) - ${stock.sharesOwned} shares
    </option>`;
  });
}

document.getElementById('stockSelect').addEventListener('change', function() {
  const selectedOption = this.options[this.selectedIndex];
  const sharesOwned = parseInt(selectedOption.dataset.shares);
  const pricePerShare = parseFloat(selectedOption.dataset.price);
  
  const stockInfo = document.getElementById('stockInfo');
  if (this.value) {
    stockInfo.textContent = `${selectedOption.textContent} | Current Price: $${pricePerShare.toLocaleString()}`;
  } else {
    stockInfo.textContent = '';
  }
  
  // Update shares input max
  const sharesInput = document.getElementById('sharesToSell');
  sharesInput.max = sharesOwned;
  sharesInput.value = '';
  document.getElementById('sharesError').style.display = 'none';
});

document.getElementById('sellForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const ticker = document.getElementById('stockSelect').value;
  const sharesInput = document.getElementById('sharesToSell');
  const sharesToSell = parseInt(sharesInput.value);
  
  if (!validateSellInput(ticker, sharesToSell)) return;
  
  const selectedOption = document.querySelector(`#stockSelect option[value="${ticker}"]`);
  const pricePerShare = parseFloat(selectedOption.dataset.price);
  const totalSellValue = sharesToSell * pricePerShare;
  
  showConfirmModal(ticker, sharesToSell, pricePerShare, totalSellValue);
});

function validateSellInput(ticker, sharesToSell) {
  const sharesError = document.getElementById('sharesError');
  const selectedOption = document.querySelector(`#stockSelect option[value="${ticker}"]`);
  const sharesOwned = parseInt(selectedOption.dataset.shares);
  
  if (!ticker) {
    sharesError.textContent = 'Please select a stock';
    sharesError.style.display = 'block';
    return false;
  }
  
  if (!sharesToSell || sharesToSell <= 0) {
    sharesError.textContent = 'Enter a valid number of shares (1 or more)';
    sharesError.style.display = 'block';
    return false;
  }
  
  if (sharesToSell > sharesOwned) {
    sharesError.textContent = `You only own ${sharesOwned} shares`;
    sharesError.style.display = 'block';
    return false;
  }
  
  sharesError.style.display = 'none';
  return true;
}

function showConfirmModal(ticker, sharesToSell, pricePerShare, totalSellValue) {
  const selectedOption = document.querySelector(`#stockSelect option[value="${ticker}"]`);
  const stockName = selectedOption.textContent.split(' (')[0];
  
  document.getElementById('confirmDetails').innerHTML = `
    <div><span class="label">Stock:</span><span class="value">${stockName}</span></div>
    <div><span class="label">Ticker:</span><span class="value">${ticker}</span></div>
    <div><span class="label">Shares to Sell:</span><span class="value">${sharesToSell.toLocaleString()}</span></div>
    <div><span class="label">Price per Share:</span><span class="value">$${pricePerShare.toLocaleString()}</span></div>
    <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
      <span class="label">Total Sell Value:</span>
      <span class="value positive">$${totalSellValue.toLocaleString()}</span>
    </div>
  `;
  
  document.getElementById('confirmModal').style.display = 'flex';
}

document.getElementById('cancelSellBtn').addEventListener('click', function() {
  document.getElementById('confirmModal').style.display = 'none';
});

document.getElementById('confirmSellBtn').addEventListener('click', async function() {
  const ticker = document.getElementById('stockSelect').value;
  const sharesToSell = parseInt(document.getElementById('sharesToSell').value);
  
  try {
    const response = await fetch('/api/trades/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, shares: sharesToSell })
    });
    
    if (response.ok) {
      alert('Sell order confirmed! Portfolio updated.');
      window.refreshUserDashboard?.(); // Refresh dashboard if available
      document.getElementById('confirmModal').style.display = 'none';
      document.getElementById('sellForm').reset();
      loadUserPortfolioForSell(); // Reload portfolio
    } else {
      alert('Sell failed. Please try again.');
    }
  } catch (error) {
    alert('Error processing sell order.');
  }
});

// ==============================
// Sell Stocks Page Function
// ==============================

let userTransactions = [];
let filteredTransactions = [];

// Load from backend API
async function loadUserTransactions() {
  try {
    const response = await fetch('/api/trades/transactions');
    if (!response.ok) throw new Error('Failed to load transactions');

    userTransactions = await response.json();
    // default filtered set = all
    filteredTransactions = [...userTransactions];

    applySort();
    renderTransactionsTable();

  } catch (error) {
    console.error('Error loading transactions:', error);
    const tbody = document.getElementById('transactionsTableBody');
    const msg = document.getElementById('transactionsEmptyMessage');

    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; color:#dc2626;">Error loading transactions</td></tr>';
    }
    if (msg) {
      msg.style.display = 'none';
    }
  }
}

// Apply search + keep current sort
function applySearch() {
  const searchInput = document.getElementById('transactionSearch');
  const query = (searchInput?.value || '').trim().toLowerCase();

  if (!query) {
    filteredTransactions = [...userTransactions];
  } else {
    filteredTransactions = userTransactions.filter(tx => {
      const name = (tx.stockName || '').toLowerCase();
      const ticker = (tx.ticker || '').toLowerCase();
      return name.includes(query) || ticker.includes(query);
    });
  }

  applySort();
  renderTransactionsTable();
}

// Apply sort order based on select
function applySort() {
  const sortSelect = document.getElementById('sortOrder');
  const order = sortSelect ? sortSelect.value : 'newest';

  filteredTransactions.sort((a, b) => {
    // Build a Date from date + time strings
    const aDate = new Date(`${a.date}T${a.time || '00:00:00'}`);
    const bDate = new Date(`${b.date}T${b.time || '00:00:00'}`);

    return order === 'oldest' ? aDate - bDate : bDate - aDate;
  });
}

// Render table body
function renderTransactionsTable() {
  const tbody = document.getElementById('transactionsTableBody');
  const emptyMsg = document.getElementById('transactionsEmptyMessage');
  if (!tbody) return;

  if (!filteredTransactions.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;">No transactions found</td></tr>';
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  tbody.innerHTML = filteredTransactions.map(tx => {
    const actionUpper = (tx.action || '').toUpperCase();
    const isBuy = actionUpper === 'BUY' || actionUpper === 'BOUGHT';
    const actionClass = isBuy ? 'action-buy' : 'action-sell';
    const formattedTotalPrice = typeof tx.totalPrice === 'number'
      ? `$${tx.totalPrice.toLocaleString()}`
      : tx.totalPrice;

    return `
      <tr>
        <td>${tx.date || ''}</td>
        <td>${tx.time || ''}</td>
        <td>${tx.stockName || ''}</td>
        <td><strong>${tx.ticker || ''}</strong></td>
        <td>${tx.totalShares != null ? tx.totalShares.toLocaleString() : ''}</td>
        <td class="price">${formattedTotalPrice || ''}</td>
        <td class="${actionClass}">${isBuy ? 'Bought' : 'Sold'}</td>
      </tr>
    `;
  }).join('');
}

// Wire up events when this page loads
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('transactionsTable')) return;

  // Load data
  loadUserTransactions();

  // Search: button and Enter key
  const searchBtn = document.getElementById('transactionSearchBtn');
  const searchInput = document.getElementById('transactionSearch');

  if (searchBtn) searchBtn.addEventListener('click', applySearch);
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') applySearch();
    });
  }

  // Sort select
  const sortSelect = document.getElementById('sortOrder');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applySort();
      renderTransactionsTable();
    });
  }
});

// ==============================
// Admin Home Page - Stocks, Market Hours, Holidays
// ==============================

let marketHoursData = null;

// ------------------------------
// Load and render stocks (max 15)
// ------------------------------
async function loadAdminHomeStocks() {
  try {
    // Adjust this endpoint to your backend
    const response = await fetch('/api/stocks');
    if (!response.ok) throw new Error('Failed to load stocks');

    const allStocks = await response.json();
    const limited = allStocks.slice(0, 15); // max 15 rows

    const tbody = document.getElementById('adminHomeStockTableBody');
    if (!tbody) return;

    if (!limited.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;">No stocks available</td></tr>';
      return;
    }

    tbody.innerHTML = limited.map(stock => {
      // Expecting: { ticker, name, sector, price, priceChange }
      const isPositive = stock.priceChange >= 0;
      const prevPrice = stock.price - stock.priceChange;
      const changePercent = prevPrice > 0
        ? ((stock.priceChange / prevPrice) * 100).toFixed(2)
        : '0.00';

      return `
        <tr>
          <td><strong>${stock.ticker}</strong></td>
          <td>${stock.name}</td>
          <td>${stock.sector}</td>
          <td class="price">$${stock.price.toLocaleString()}</td>
          <td class="${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : ''}$${Math.abs(stock.priceChange).toLocaleString()}
          </td>
          <td class="${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : ''}${changePercent}%
          </td>
          <td class="actions-cell">
            <a href="admin_edit_stocks.html?ticker=${stock.ticker}" class="btn-edit">Edit</a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading admin stocks:', error);
    const tbody = document.getElementById('adminHomeStockTableBody');
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; color:#dc2626;">Error loading stocks</td></tr>';
    }
  }
}

// ------------------------------
// Load and render market hours + holidays
// ------------------------------
async function loadMarketHours() {
  try {
    // Adjust this endpoint to your backend
    const response = await fetch('/api/admin/market/hours');
    if (!response.ok) throw new Error('Failed to load market hours');

    marketHoursData = await response.json();

    renderMarketHoursTable();
    renderHolidayHoursList();
    renderMarketCalendar();
  } catch (error) {
    console.error('Error loading market hours:', error);
  }
}

function renderMarketHoursTable() {
  const container = document.getElementById('marketHoursTable');
  if (!container || !marketHoursData?.weeklyHours) return;

  container.innerHTML = marketHoursData.weeklyHours.map(entry => {
    // Expecting: { day: "Monday", open: "09:30", close: "16:00" } or nulls for closed
    const isClosed = !entry.open || !entry.close;
    const hoursText = isClosed
      ? 'Closed'
      : `${formatTime(entry.open)} – ${formatTime(entry.close)}`;

    return `
      <div class="hours-row">
        <span>${entry.day}</span>
        <span>${hoursText}</span>
      </div>
    `;
  }).join('');
}

function renderHolidayHoursList() {
  const container = document.getElementById('holidayHoursList');
  if (!container) return;

  const holidays = marketHoursData?.holidays || [];

  if (!holidays.length) {
    container.innerHTML = '<p class="note">No holiday hours configured.</p>';
    return;
  }

  container.innerHTML = holidays.map(h => {
    // Expecting: { date: "2026-01-01", type: "closed"|"short", label?, hours? }
    const date = new Date(h.date);
    const labelDate = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    let desc;
    if (h.type === 'closed') {
      desc = 'Closed';
    } else if (h.type === 'short') {
      desc = h.hours || 'Short day';
    } else {
      desc = h.hours || 'Hours set';
    }

    return `
      <div class="hours-row">
        <span>${labelDate}</span>
        <span>${desc}${h.label ? ` (${h.label})` : ''}</span>
      </div>
    `;
  }).join('');
}

// HH:mm -> 9:30 AM
function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

// ------------------------------
// Calendar using holidays from marketHoursData
// ------------------------------
function renderMarketCalendar() {
  const calendarEl = document.getElementById('marketCalendar');
  const monthLabelEl = document.getElementById('calendarMonthLabel');
  if (!calendarEl || !monthLabelEl) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  monthLabelEl.textContent = `${monthNames[month]} ${year}`;

  calendarEl.innerHTML = '';

  // Day labels
  dayNames.forEach(d => {
    const el = document.createElement('div');
    el.className = 'day-label';
    el.textContent = d;
    calendarEl.appendChild(el);
  });

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Holidays that fall in this month
  const holidays = (marketHoursData?.holidays || []).filter(h => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const holidayMap = {};
  holidays.forEach(h => {
    const d = new Date(h.date).getDate();
    holidayMap[d] = h;
  });

  // Blank cells before first of month
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell';
    calendarEl.appendChild(empty);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.textContent = day;

    const holiday = holidayMap[day];
    if (holiday) {
      if (holiday.type === 'closed') cell.classList.add('closed');
      if (holiday.type === 'short') cell.classList.add('short');
      cell.title = holiday.label || '';
    }

    calendarEl.appendChild(cell);
  }
}

// ------------------------------
// Initialization
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  
  
  // Only run on admin home
  if (!document.getElementById('adminHomeStockTableBody')) return;

  loadAdminHomeStocks();
  loadMarketHours();
});
