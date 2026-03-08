import { pool } from "../db/pool.js";

export async function createUser({ email, username, passwordHash, fullName, role = "USER" }) {
  const [res] = await pool.query(
    `INSERT INTO users (email, username, password_hash, full_name, role) VALUES (:email, :username, :passwordHash, :fullName, :role)`,
    { email, username: username || null, passwordHash, fullName, role }
  );
  return res.insertId;
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(`SELECT * FROM users WHERE email = :email LIMIT 1`, { email });
  return rows[0] || null;
}

export async function findUserByUsername(username) {
  const [rows] = await pool.query(`SELECT * FROM users WHERE username = :username LIMIT 1`, { username });
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.query(`SELECT * FROM users WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
}

export async function countUsers(role = null) {
  const [rows] = await pool.query(role ? `SELECT COUNT(*) AS total FROM users WHERE role = :role` : `SELECT COUNT(*) AS total FROM users`, role ? { role } : {});
  return Number(rows[0]?.total || 0);
}
