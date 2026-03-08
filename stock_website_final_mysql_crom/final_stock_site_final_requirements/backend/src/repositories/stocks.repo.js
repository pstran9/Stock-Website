import { pool } from "../db/pool.js";

export async function listStocks() {
  const [rows] = await pool.query(
    `SELECT ticker, name, volume, opening_price, last_price, day_high, day_low, volatility, drift, updated_at
     FROM stocks ORDER BY ticker`
  );
  return rows;
}

export async function getStockByTicker(ticker) {
  const [rows] = await pool.query(
    `SELECT id, ticker, name, volume, opening_price, last_price, day_high, day_low, volatility, drift, updated_at
     FROM stocks WHERE ticker = :t LIMIT 1`,
    { t: ticker.toUpperCase() }
  );
  return rows[0] || null;
}

export async function createStock({ ticker, name, volume = 0, lastPrice, volatility, drift }) {
  const [res] = await pool.query(
    `INSERT INTO stocks (ticker, name, volume, opening_price, last_price, day_high, day_low, volatility, drift)
     VALUES (:ticker, :name, :volume, :last_price, :last_price, :last_price, :last_price, :volatility, :drift)`,
    {
      ticker: ticker.toUpperCase(),
      name,
      volume,
      last_price: lastPrice,
      volatility: volatility ?? 0.02,
      drift: drift ?? 0.0001,
    }
  );
  return res.insertId;
}

export async function updateStock(ticker, patch) {
  const fields = [];
  const params = { t: ticker.toUpperCase() };

  if (patch.name !== undefined) { fields.push("name = :name"); params.name = patch.name; }
  if (patch.lastPrice !== undefined) {
    fields.push("last_price = :last_price"); params.last_price = patch.lastPrice;
    fields.push("opening_price = COALESCE(opening_price, :opening_price)"); params.opening_price = patch.lastPrice;
  }
  if (patch.volume !== undefined) { fields.push("volume = :volume"); params.volume = patch.volume; }
  if (patch.volatility !== undefined) { fields.push("volatility = :volatility"); params.volatility = patch.volatility; }
  if (patch.drift !== undefined) { fields.push("drift = :drift"); params.drift = patch.drift; }

  if (!fields.length) return 0;
  const [res] = await pool.query(`UPDATE stocks SET ${fields.join(", ")}, updated_at = NOW() WHERE ticker = :t`, params);
  return res.affectedRows;
}

export async function deleteStock(ticker) {
  const [res] = await pool.query("DELETE FROM stocks WHERE ticker = :t", { t: ticker.toUpperCase() });
  return res.affectedRows;
}

export async function writePriceHistory(stockId, price) {
  await pool.query(`INSERT INTO price_history (stock_id, price) VALUES (:stockId, :price)`, { stockId, price });
}

export async function listHolidays() {
  const [rows] = await pool.query(`SELECT holiday_date, name FROM market_holidays ORDER BY holiday_date`);
  return rows;
}

export async function upsertHoliday({ holidayDate, name }) {
  await pool.query(
    `INSERT INTO market_holidays (holiday_date, name) VALUES (:holidayDate, :name)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    { holidayDate, name }
  );
}

export async function deleteHoliday(holidayDate) {
  const [res] = await pool.query(`DELETE FROM market_holidays WHERE holiday_date = :holidayDate`, { holidayDate });
  return res.affectedRows;
}
