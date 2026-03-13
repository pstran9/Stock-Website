import * as TradesRepo from "../repositories/trades.repo.js";
import { executeTrade } from "../services/trading.service.js";

export async function portfolio(req, res, next) {
  try {
    const data = await TradesRepo.getPortfolio(req.user.userId);

    const positions = (data.positions || []).map((p) => ({
      ticker: p.ticker,
      symbol: p.ticker,
      name: p.name,
      company: p.name,
      quantity: Number(p.shares ?? 0),
      shares: Number(p.shares ?? 0),
      avgPrice: Number(p.current_price ?? 0),
      currentPrice: Number(p.current_price ?? 0),
      price: Number(p.current_price ?? 0),
      marketValue: Number(p.market_value ?? 0),
      totalValue: Number(p.market_value ?? 0),
      profitLoss: 0,
    }));

    res.json({
      cashBalance: Number(data.cashBalance ?? 0),
      positions,
      portfolio: positions,
      holdings: positions,
    });
  } catch (e) {
    next(e);
  }
}

export async function transactions(req, res, next) {
  try {
    const items = await TradesRepo.listTransactions(req.user.userId);
    res.json(
      items.map((t) => ({
        id: t.id,
        ticker: t.ticker,
        symbol: t.ticker,
        stockName: t.name,
        name: t.name,
        shares: Number(t.shares ?? 0),
        quantity: Number(t.shares ?? 0),
        price: Number(t.price ?? 0),
        total: Number(t.total_amount ?? 0),
        totalPrice: Number(t.total_amount ?? 0),
        action: t.type,
        type: t.type,
        createdAt: t.created_at,
        date: t.created_at?.toISOString?.().slice(0, 10) ?? "",
        time: t.created_at?.toISOString?.().slice(11, 19) ?? "",
      }))
    );
  } catch (e) {
    next(e);
  }
}

export async function buy(req, res, next) {
  try {
    const out = await executeTrade({
      userId: req.user.userId,
      ticker: req.validated.body.ticker,
      type: "BUY",
      shares: req.validated.body.shares,
    });
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}

export async function sell(req, res, next) {
  try {
    const out = await executeTrade({
      userId: req.user.userId,
      ticker: req.validated.body.ticker,
      type: "SELL",
      shares: req.validated.body.shares,
    });
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}
