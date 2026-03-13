import * as Stocks from "../repositories/stocks.repo.js";
import * as Pricing from "../services/pricing.service.js";

function serializeStock(row) {
  const price = Number(
    row.price ?? row.currentPrice ?? row.last_price ?? row.lastPrice ?? 0
  );

  return {
    id: row.id,
    ticker: row.ticker,
    symbol: row.ticker,
    name: row.name,
    company: row.name,
    sector: row.sector ?? "",
    price,
    currentPrice: price,
    lastPrice: price,
    change: Number(row.change ?? row.priceChange ?? 0),
    priceChange: Number(row.priceChange ?? row.change ?? 0),
    percentChange: Number(row.percentChange ?? 0),
    volatility: row.volatility ?? null,
    drift: row.drift ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

export async function list(req, res, next) {
  try {
    const stocks = await Stocks.listStocks();
    // Frontend currently expects a raw array, not { stocks: [...] }
    res.json(stocks.map(serializeStock));
  } catch (e) {
    next(e);
  }
}

export async function get(req, res, next) {
  try {
    const stock = await Stocks.getStockByTicker(req.params.ticker);
    if (!stock) return res.status(404).json({ error: "Not found" });
    res.json(serializeStock(stock));
  } catch (e) {
    next(e);
  }
}

export async function quote(req, res, next) {
  try {
    const quote = await Pricing.getQuote(req.params.ticker);
    res.json({
      ticker: quote.ticker,
      symbol: quote.ticker,
      name: quote.name,
      company: quote.name,
      sector: quote.sector ?? "",
      price: Number(quote.price),
      currentPrice: Number(quote.price),
      marketOpen: quote.marketOpen,
      asOf: quote.asOf,
    });
  } catch (e) {
    next(e);
  }
}

export async function history(req, res, next) {
  try {
    const limit = req.query.limit ?? 120;
    const points = await Pricing.getPriceHistory(req.params.ticker, limit);
    res.json({
      ticker: req.params.ticker.toUpperCase(),
      points,
    });
  } catch (e) {
    next(e);
  }
}
