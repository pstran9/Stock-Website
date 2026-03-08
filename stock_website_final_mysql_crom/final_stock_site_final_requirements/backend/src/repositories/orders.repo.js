import { pool, withTx } from "../db/pool.js";
import { getQuote } from "../services/pricing.service.js";

export async function listOrders(userId) {
  const [rows] = await pool.query(
    `SELECT o.id, s.ticker, o.type, o.shares, o.requested_price, o.status, o.created_at, o.executed_at, o.cancelled_at
     FROM orders o JOIN stocks s ON s.id = o.stock_id
     WHERE o.user_id = :userId ORDER BY o.created_at DESC`,
    { userId }
  );
  return rows;
}

export async function createOrder({ userId, ticker, type, shares }) {
  const quote = await getQuote(ticker);
  const [stockRows] = await pool.query(`SELECT id FROM stocks WHERE ticker = :ticker LIMIT 1`, { ticker: ticker.toUpperCase() });
  const stock = stockRows[0];
  const [res] = await pool.query(
    `INSERT INTO orders (user_id, stock_id, type, shares, requested_price, status) VALUES (:userId, :stockId, :type, :shares, :requestedPrice, 'PENDING')`,
    { userId, stockId: stock.id, type, shares, requestedPrice: quote.price }
  );
  return { id: res.insertId, quote };
}

export async function cancelOrder({ userId, orderId }) {
  const [res] = await pool.query(
    `UPDATE orders SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = :orderId AND user_id = :userId AND status = 'PENDING'`,
    { orderId, userId }
  );
  return res.affectedRows;
}
