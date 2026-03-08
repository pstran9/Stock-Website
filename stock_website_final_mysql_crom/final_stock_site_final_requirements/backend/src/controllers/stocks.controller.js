import * as Stocks from "../repositories/stocks.repo.js";
import * as Pricing from "../services/pricing.service.js";

export async function list(req, res, next) {
  try {
    const rows = await Stocks.listStocks();
    const stocks = rows.map((row) => {
      const price = Number(row.last_price);
      const openingPrice = Number(row.opening_price);
      const change = price - openingPrice;
      const percentChange = openingPrice ? (change / openingPrice) * 100 : 0;
      return {
        ticker: row.ticker,
        symbol: row.ticker,
        name: row.name,
        company: row.name,
        volume: Number(row.volume || 0),
        marketCap: Number((price * Number(row.volume || 0)).toFixed(2)),
        openingPrice: Number(openingPrice.toFixed(2)),
        high: Number(Number(row.day_high).toFixed(2)),
        low: Number(Number(row.day_low).toFixed(2)),
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        percentChange: Number(percentChange.toFixed(2)),
        updatedAt: row.updated_at,
      };
    });
    res.json({ stocks });
  } catch (e) { next(e); }
}

export async function get(req, res, next) {
  try {
    const stock = await Stocks.getStockByTicker(req.params.ticker);
    if (!stock) return res.status(404).json({ error: "Not found" });
    res.json({ stock });
  } catch (e) { next(e); }
}

export async function quote(req, res, next) {
  try {
    const quote = await Pricing.getQuote(req.params.ticker);
    res.json({ quote });
  } catch (e) { next(e); }
}

export async function history(req, res, next) {
  try {
    const limit = req.query.limit ?? 120;
    const points = await Pricing.getPriceHistory(req.params.ticker, limit);
    res.json({ ticker: req.params.ticker.toUpperCase(), points });
  } catch (e) { next(e); }
}
