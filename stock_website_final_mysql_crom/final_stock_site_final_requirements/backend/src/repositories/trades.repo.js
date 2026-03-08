import { pool } from "../db/pool.js";

export async function getPortfolio(userId) {
  const [rows] = await pool.query(
    `SELECT s.id AS stock_id, s.ticker, s.name, p.shares, s.last_price,
            COALESCE((
              SELECT SUM(CASE WHEN t.type = 'BUY' THEN t.total_amount ELSE 0 END) /
                     NULLIF(SUM(CASE WHEN t.type = 'BUY' THEN t.shares ELSE 0 END), 0)
              FROM transactions t
              WHERE t.user_id = :userId AND t.stock_id = s.id AND t.type = 'BUY'
            ), s.last_price) AS avg_price
     FROM positions p
     JOIN stocks s ON s.id = p.stock_id
     WHERE p.user_id = :userId
     ORDER BY s.ticker`,
    { userId }
  );
  return rows.map((row) => ({
    ticker: row.ticker,
    name: row.name,
    shares: Number(row.shares),
    avgPrice: Number(Number(row.avg_price).toFixed(2)),
    currentPrice: Number(Number(row.last_price).toFixed(2)),
    value: Number((Number(row.shares) * Number(row.last_price)).toFixed(2)),
  }));
}

export async function listTransactions(userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT t.id, t.type, s.ticker, t.shares, t.price, t.total_amount, t.created_at
     FROM transactions t
     LEFT JOIN stocks s ON s.id = t.stock_id
     WHERE t.user_id = :userId
     ORDER BY t.created_at DESC
     LIMIT :limit`,
    { userId, limit: Number(limit) }
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    ticker: row.ticker,
    shares: Number(row.shares || 0),
    price: Number(row.price || 0),
    totalAmount: Number(row.total_amount || 0),
    createdAt: row.created_at,
  }));
}

export async function countTransactions() {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM transactions");
  return Number(rows[0]?.total || 0);
}
