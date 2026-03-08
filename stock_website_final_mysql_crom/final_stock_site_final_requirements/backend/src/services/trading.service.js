import { withTx } from "../db/pool.js";
import { getQuote } from "./pricing.service.js";

export async function executeTrade({ userId, ticker, type, shares }) {
  const qty = Number(shares);
  if (!Number.isFinite(qty) || qty <= 0) {
    const err = new Error("Shares must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  const quote = await getQuote(ticker);
  const execPrice = Number(quote.price);
  const total = Number((execPrice * qty).toFixed(2));
  const t = ticker.toUpperCase();

  return withTx(async (conn) => {
    const [[stock]] = await conn.query(
      "SELECT id FROM stocks WHERE ticker = :t LIMIT 1 FOR UPDATE",
      { t }
    );
    if (!stock) {
      const err = new Error("Unknown ticker");
      err.statusCode = 404;
      throw err;
    }

    const [[user]] = await conn.query(
      "SELECT cash_balance FROM users WHERE id = :userId LIMIT 1 FOR UPDATE",
      { userId }
    );

    const [[pos]] = await conn.query(
      `SELECT shares FROM positions
       WHERE user_id = :userId AND stock_id = :stockId
       LIMIT 1 FOR UPDATE`,
      { userId, stockId: stock.id }
    );

    const curShares = Number(pos?.shares || 0);

    if (type === "BUY") {
      if (Number(user.cash_balance) < total) {
        const err = new Error("Insufficient cash balance");
        err.statusCode = 400;
        throw err;
      }

      await conn.query(
        "UPDATE users SET cash_balance = cash_balance - :total WHERE id = :userId",
        { total, userId }
      );

      if (pos) {
        await conn.query(
          "UPDATE positions SET shares = shares + :qty WHERE user_id = :userId AND stock_id = :stockId",
          { qty, userId, stockId: stock.id }
        );
      } else {
        await conn.query(
          "INSERT INTO positions (user_id, stock_id, shares) VALUES (:userId, :stockId, :qty)",
          { userId, stockId: stock.id, qty }
        );
      }
    } else if (type === "SELL") {
      if (curShares < qty) {
        const err = new Error("Insufficient shares to sell");
        err.statusCode = 400;
        throw err;
      }

      await conn.query(
        "UPDATE users SET cash_balance = cash_balance + :total WHERE id = :userId",
        { total, userId }
      );

      await conn.query(
        "UPDATE positions SET shares = shares - :qty WHERE user_id = :userId AND stock_id = :stockId",
        { qty, userId, stockId: stock.id }
      );

      await conn.query(
        "DELETE FROM positions WHERE user_id = :userId AND stock_id = :stockId AND shares <= 0",
        { userId, stockId: stock.id }
      );
    } else {
      const err = new Error("Invalid trade type");
      err.statusCode = 400;
      throw err;
    }

    await conn.query(
      `INSERT INTO transactions (user_id, stock_id, type, shares, price, total_amount)
       VALUES (:userId, :stockId, :type, :shares, :price, :total)`,
      { userId, stockId: stock.id, type, shares: qty, price: execPrice, total }
    );

    const [[userAfter]] = await conn.query(
      "SELECT cash_balance FROM users WHERE id = :userId LIMIT 1",
      { userId }
    );

    return {
      quote,
      trade: {
        ticker: t,
        type,
        shares: qty,
        price: execPrice,
        totalAmount: total,
        cashBalance: Number(userAfter.cash_balance),
      },
    };
  });
}
