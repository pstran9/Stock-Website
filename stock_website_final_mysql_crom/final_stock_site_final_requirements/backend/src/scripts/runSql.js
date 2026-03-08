import fs from "fs";
import path from "path";
import { pool } from "../db/pool.js";

async function main() {
  const sqlPath = process.argv[2];
  if (!sqlPath) {
    console.error("Usage: node src/scripts/runSql.js <path-to-sql>");
    process.exit(1);
  }

  const full = path.isAbsolute(sqlPath) ? sqlPath : path.join(process.cwd(), sqlPath);
  const sql = fs.readFileSync(full, "utf-8");

  // simplistic splitter; good enough for these scripts
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await pool.query(stmt);
  }

  console.log(`[sql] executed ${statements.length} statements from ${sqlPath}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
