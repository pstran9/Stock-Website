import * as Stocks from "../repositories/stocks.repo.js";
import * as Market from "../services/market.service.js";
import { countUsers } from "../repositories/users.repo.js";
import { countTransactions } from "../repositories/trades.repo.js";

export async function createStock(req, res, next) {
  try { const id = await Stocks.createStock(req.validated.body); res.status(201).json({ message: "Stock added successfully.", id }); }
  catch (e) { next(e); }
}
export async function patchStock(req, res, next) {
  try { const n = await Stocks.updateStock(req.params.ticker, req.validated.body); if (!n) return res.status(404).json({ error: "Not found or no changes" }); res.json({ message: "Stock updated successfully.", updated: n }); }
  catch (e) { next(e); }
}
export async function removeStock(req, res, next) {
  try { const n = await Stocks.deleteStock(req.params.ticker); if (!n) return res.status(404).json({ error: "Not found" }); res.json({ message: "Stock deleted successfully.", deleted: n }); }
  catch (e) { next(e); }
}
export async function marketStatus(req, res, next) { try { res.json(await Market.marketStatus()); } catch (e) { next(e); } }
export async function getHours(req, res, next) { try { res.json({ hours: await Market.getMarketHours() }); } catch (e) { next(e); } }
export async function upsertHours(req, res, next) { try { await Market.upsertMarketHours(req.validated.body); res.status(201).json({ ok: true }); } catch (e) { next(e); } }
export async function getHolidays(req, res, next) { try { res.json({ holidays: await Stocks.listHolidays() }); } catch (e) { next(e); } }
export async function upsertHoliday(req, res, next) { try { await Stocks.upsertHoliday(req.validated.body); res.status(201).json({ ok: true }); } catch (e) { next(e); } }
export async function deleteHoliday(req, res, next) { try { const n = await Stocks.deleteHoliday(req.params.holidayDate); if (!n) return res.status(404).json({ error: 'Not found' }); res.json({ ok: true }); } catch (e) { next(e); } }
export async function stats(req, res, next) {
  try {
    const [totalUsers, totalStocks, totalTransactions] = await Promise.all([
      countUsers("USER"),
      Stocks.listStocks().then((rows) => rows.length),
      countTransactions(),
    ]);
    res.json({ totalUsers, totalStocks, totalTransactions });
  } catch (e) { next(e); }
}
