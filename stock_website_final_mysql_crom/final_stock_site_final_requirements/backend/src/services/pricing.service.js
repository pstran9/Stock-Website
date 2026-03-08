import { pool } from "../db/pool.js";
import { isMarketOpen } from "./market.service.js";
import { getStockByTicker, writePriceHistory } from "../repositories/stocks.repo.js";

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export async function getQuote(ticker) {
  const stock = await getStockByTicker(ticker);
  if (!stock) { const err = new Error("Unknown ticker"); err.statusCode = 404; throw err; }

  const marketOpen = await isMarketOpen(new Date());
  let price = Number(stock.last_price);
  let high = Number(stock.day_high);
  let low = Number(stock.day_low);
  const openingPrice = Number(stock.opening_price);

  if (marketOpen) {
    const dt = 1 / (6.5 * 60);
    const mu = Number(stock.drift ?? 0.0001);
    const sigma = Number(stock.volatility ?? 0.02);
    const shock = randn() * Math.sqrt(dt);
    const next = price * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * shock);
    price = clamp(next, 0.50, 100000);
    high = Math.max(high, price);
    low = Math.min(low, price);
    await pool.query(
      `UPDATE stocks SET last_price = :p, day_high = :high, day_low = :low, updated_at = NOW() WHERE id = :id`,
      { p: price, high, low, id: stock.id }
    );
    await writePriceHistory(stock.id, price);
  }

  return {
    ticker: stock.ticker,
    name: stock.name,
    volume: Number(stock.volume || 0),
    openingPrice: Number(openingPrice.toFixed(2)),
    price: Number(price.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    marketCap: Number((price * Number(stock.volume || 0)).toFixed(2)),
    marketOpen,
    asOf: new Date().toISOString(),
  };
}

export async function getPriceHistory(ticker, limit = 120) {
  const stock = await getStockByTicker(ticker);
  if (!stock) { const err = new Error("Unknown ticker"); err.statusCode = 404; throw err; }
  const [rows] = await pool.query(
    `SELECT price, created_at FROM price_history WHERE stock_id = :stockId ORDER BY created_at DESC LIMIT :limit`,
    { stockId: stock.id, limit: Number(limit) }
  );
  return rows.reverse();
}
