import { pool } from "../db/pool.js";

export async function listStocks() {
  const [rows] = await pool.query(
    "SELECT ticker, name, sector, last_price, volatility, drift, updated_at FROM stocks ORDER BY ticker"
  );
  return rows;
}

export async function getStockByTicker(ticker) {
  const [rows] = await pool.query(
    "SELECT id, ticker, name, sector, last_price, volatility, drift, updated_at FROM stocks WHERE ticker = :t LIMIT 1",
    { t: ticker.toUpperCase() }
  );
  return rows[0] || null;
}

export async function createStock({ ticker, name, sector = "", lastPrice, volatility, drift }) {
  const [res] = await pool.query(
    `INSERT INTO stocks (ticker, name, sector, last_price, volatility, drift)
     VALUES (:ticker, :name, :sector, :last_price, :volatility, :drift)`,
    {
      ticker: ticker.toUpperCase(),
      name,
      sector,
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

  if (patch.name !== undefined) {
    fields.push("name = :name");
    params.name = patch.name;
  }
  if (patch.sector !== undefined) {
    fields.push("sector = :sector");
    params.sector = patch.sector;
  }
  if (patch.lastPrice !== undefined) {
    fields.push("last_price = :last_price");
    params.last_price = patch.lastPrice;
  }
  if (patch.volatility !== undefined) {
    fields.push("volatility = :volatility");
    params.volatility = patch.volatility;
  }
  if (patch.drift !== undefined) {
    fields.push("drift = :drift");
    params.drift = patch.drift;
  }

  if (!fields.length) return 0;

  const [res] = await pool.query(
    `UPDATE stocks SET ${fields.join(", ")}, updated_at = NOW() WHERE ticker = :t`,
    params
  );
  return res.affectedRows;
}

export async function deleteStock(ticker) {
  const [res] = await pool.query("DELETE FROM stocks WHERE ticker = :t", { t: ticker.toUpperCase() });
  return res.affectedRows;
}

export async function writePriceHistory(stockId, price) {
  await pool.query(
    "INSERT INTO price_history (stock_id, price) VALUES (:stockId, :price)",
    { stockId, price }
  );
}
