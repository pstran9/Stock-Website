import { pool } from "../db/pool.js";

export async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = :email LIMIT 1", { email });
  return rows[0] || null;
}

export async function findUserByUsername(username) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER(:username) LIMIT 1",
      { username }
    );
    return rows[0] || null;
  } catch (error) {
    if (error?.code === "ER_BAD_FIELD_ERROR") {
      return null;
    }
    throw error;
  }
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, email, full_name, role, cash_balance, created_at FROM users WHERE id = :id LIMIT 1",
    { id }
  );
  return rows[0] || null;
}

export async function createUser({ email, passwordHash, fullName, username = null, role = "USER" }) {
  try {
    const [res] = await pool.query(
      `INSERT INTO users (email, username, password_hash, full_name, role, cash_balance)
       VALUES (:email, :username, :password_hash, :full_name, :role, 10000.00)`,
      { email, username, password_hash: passwordHash, full_name: fullName, role }
    );
    return res.insertId;
  } catch (error) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") {
      throw error;
    }

    const [res] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, cash_balance)
       VALUES (:email, :password_hash, :full_name, :role, 10000.00)`,
      { email, password_hash: passwordHash, full_name: fullName, role }
    );
    return res.insertId;
  }
}

export async function updateUserCash(conn, userId, delta) {
  // delta can be + or -
  await conn.query(
    "UPDATE users SET cash_balance = cash_balance + :delta WHERE id = :userId",
    { delta, userId }
  );
}
