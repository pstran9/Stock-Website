import * as Stocks from "../repositories/stocks.repo.js";
import * as Market from "../services/market.service.js";

const DAY_LABELS = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

function normalizeStockPayload(body) {
  return {
    ticker: body.ticker,
    name: body.name,
    sector: body.sector ?? "",
    lastPrice: body.lastPrice ?? body.price ?? 10,
    volatility: body.volatility,
    drift: body.drift,
  };
}

export async function createStock(req, res, next) {
  try {
    const id = await Stocks.createStock(normalizeStockPayload(req.validated.body));
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}

export async function patchStock(req, res, next) {
  try {
    const payload = {
      ...(req.validated.body.name !== undefined
        ? { name: req.validated.body.name }
        : {}),
      ...(req.validated.body.sector !== undefined
        ? { sector: req.validated.body.sector }
        : {}),
      ...(req.validated.body.lastPrice !== undefined ||
      req.validated.body.price !== undefined
        ? { lastPrice: req.validated.body.lastPrice ?? req.validated.body.price }
        : {}),
      ...(req.validated.body.volatility !== undefined
        ? { volatility: req.validated.body.volatility }
        : {}),
      ...(req.validated.body.drift !== undefined
        ? { drift: req.validated.body.drift }
        : {}),
    };

    const n = await Stocks.updateStock(req.params.ticker, payload);
    if (!n) return res.status(404).json({ error: "Not found or no changes" });

    res.json({ updated: n });
  } catch (e) {
    next(e);
  }
}

export async function removeStock(req, res, next) {
  try {
    const n = await Stocks.deleteStock(req.params.ticker);
    if (!n) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: n });
  } catch (e) {
    next(e);
  }
}

export async function marketStatus(req, res, next) {
  try {
    res.json(await Market.marketStatus());
  } catch (e) {
    next(e);
  }
}

export async function getHours(req, res, next) {
  try {
    const hours = await Market.getMarketHours();

    res.json({
      hours,
      weeklyHours: hours.map((h) => ({
        day: DAY_LABELS[h.day_of_week] ?? `Day ${h.day_of_week}`,
        dayOfWeek: h.day_of_week,
        open: h.open_time_utc,
        close: h.close_time_utc,
      })),
      holidays: [],
    });
  } catch (e) {
    next(e);
  }
}

export async function upsertHours(req, res, next) {
  try {
    await Market.upsertMarketHours(req.validated.body);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
