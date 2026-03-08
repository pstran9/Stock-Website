import { withTx } from "../db/pool.js";

export async function adjustCash({ userId, type, amount }) {
  const normalizedType = String(type).toUpperCase();
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error("Amount must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  return withTx(async (conn) => {
    const [[user]] = await conn.query(
      "SELECT cash_balance FROM users WHERE id = :userId LIMIT 1 FOR UPDATE",
      { userId }
    );
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const current = Number(user.cash_balance);
    const nextBalance = normalizedType === "DEPOSIT" ? current + value : current - value;

    if (normalizedType === "WITHDRAW" && nextBalance < 0) {
      const err = new Error("Insufficient cash balance");
      err.statusCode = 400;
      throw err;
    }

    await conn.query(
      "UPDATE users SET cash_balance = :balance WHERE id = :userId",
      { balance: Number(nextBalance.toFixed(2)), userId }
    );

    await conn.query(
      `INSERT INTO transactions (user_id, stock_id, type, shares, price, total_amount)
       VALUES (:userId, NULL, :type, 0, 0, :amount)`,
      { userId, type: normalizedType, amount: Number(value.toFixed(2)) }
    );

    return { cashBalance: Number(nextBalance.toFixed(2)) };
  });
}
