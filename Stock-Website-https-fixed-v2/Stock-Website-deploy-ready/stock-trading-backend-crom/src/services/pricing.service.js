import { pool } from "../db/pool.js";
import { isMarketOpen } from "./market.service.js";
import { getStockByTicker, writePriceHistory } from "../repositories/stocks.repo.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Quote generation:
 * - Updates price only when market is open
 * - Records price_history for charting
 */
export async function getQuote(ticker) {
  const stock = await getStockByTicker(ticker);
  if (!stock) {
    const err = new Error("Unknown ticker");
    err.statusCode = 404;
    throw err;
  }

  const marketOpen = await isMarketOpen(new Date());
  let price = Number(stock.last_price);

  if (marketOpen) {
    const dt = 1 / (6.5 * 60); // each request ~= 1 min of 'market time'
    const mu = Number(stock.drift ?? 0.0001);
    const sigma = Number(stock.volatility ?? 0.02);
    const shock = randn() * Math.sqrt(dt);
    const next = price * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * shock);
    price = clamp(next, 0.5, 100000);

    await pool.query(
      "UPDATE stocks SET last_price = :p, updated_at = NOW() WHERE id = :id",
      { p: price, id: stock.id }
    );

    // Keep a short history for charting.
    await writePriceHistory(stock.id, price);
  }

  return {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector ?? "",
    price: Number(price.toFixed(2)),
    marketOpen,
    asOf: new Date().toISOString(),
  };
}

export async function getPriceHistory(ticker, limit = 120) {
  const stock = await getStockByTicker(ticker);
  if (!stock) {
    const err = new Error("Unknown ticker");
    err.statusCode = 404;
    throw err;
  }
  const [rows] = await pool.query(
    `SELECT price, created_at
     FROM price_history
     WHERE stock_id = :stockId
     ORDER BY created_at DESC
     LIMIT :limit`,
    { stockId: stock.id, limit: Number(limit) }
  );
  return rows.reverse();
}
