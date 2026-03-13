import { pool } from "../db/pool.js";

export async function getPortfolio(userId) {
  const [[user]] = await pool.query(
    `SELECT cash_balance FROM users WHERE id = :userId LIMIT 1`,
    { userId }
  );

  const [positions] = await pool.query(
    `SELECT s.ticker, s.name, p.shares, s.last_price AS current_price,
            (p.shares * s.last_price) AS market_value
     FROM positions p
     JOIN stocks s ON s.id = p.stock_id
     WHERE p.user_id = :userId
     ORDER BY s.ticker`,
    { userId }
  );

  return {
    cashBalance: Number(user?.cash_balance ?? 0),
    positions,
  };
}

export async function listTransactions(userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT t.id, t.type, s.ticker, s.name, t.shares, t.price, t.total_amount, t.created_at
     FROM transactions t
     JOIN stocks s ON s.id = t.stock_id
     WHERE t.user_id = :userId
     ORDER BY t.created_at DESC
     LIMIT :limit`,
    { userId, limit: Number(limit) }
  );
  return rows;
}
