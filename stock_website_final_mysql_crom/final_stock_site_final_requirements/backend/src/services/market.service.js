import { pool } from "../db/pool.js";

export async function isHoliday(dateISO) {
  const [rows] = await pool.query(
    "SELECT 1 AS ok FROM market_holidays WHERE holiday_date = :d LIMIT 1",
    { d: dateISO }
  );
  return rows.length > 0;
}

export async function isMarketOpen(now = new Date()) {
  const dateISO = now.toISOString().slice(0, 10);
  if (await isHoliday(dateISO)) return false;

  const day = now.getUTCDay(); // 0 Sun ... 6 Sat
  if (day === 0 || day === 6) return false;

  const [rows] = await pool.query(
    "SELECT open_time_utc, close_time_utc FROM market_hours WHERE day_of_week = :d LIMIT 1",
    { d: day }
  );
  if (!rows.length) return false;

  const cur = now.toISOString().slice(11, 19);
  return cur >= rows[0].open_time_utc && cur <= rows[0].close_time_utc;
}

export async function getMarketHours() {
  const [rows] = await pool.query(
    "SELECT day_of_week, open_time_utc, close_time_utc FROM market_hours ORDER BY day_of_week"
  );
  return rows;
}

export async function upsertMarketHours({ dayOfWeek, openTimeUtc, closeTimeUtc }) {
  await pool.query(
    `INSERT INTO market_hours (day_of_week, open_time_utc, close_time_utc)
     VALUES (:d, :o, :c)
     ON DUPLICATE KEY UPDATE open_time_utc = VALUES(open_time_utc), close_time_utc = VALUES(close_time_utc)`,
    { d: dayOfWeek, o: openTimeUtc, c: closeTimeUtc }
  );
}

export async function marketStatus() {
  const open = await isMarketOpen(new Date());
  return { marketOpen: open, asOf: new Date().toISOString() };
}
