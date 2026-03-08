import { findUserById } from "../repositories/users.repo.js";
import { getPortfolio } from "../repositories/trades.repo.js";

export async function dashboard(req, res, next) {
  try {
    const user = await findUserById(req.user.userId);
    const positions = await getPortfolio(req.user.userId);
    const totalPortfolioValue = positions.reduce((sum, p) => sum + Number(p.value), 0);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      cashBalance: Number(user.cash_balance),
      portfolio: positions.map((p) => ({
        symbol: p.ticker,
        company: p.name,
        quantity: p.shares,
        avgPrice: p.avgPrice,
        currentPrice: p.currentPrice,
        value: p.value,
      })),
      totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
    });
  } catch (e) { next(e); }
}
