import { adjustCash } from "../services/wallet.service.js";

export async function deposit(req, res, next) {
  try {
    const out = await adjustCash({ userId: req.user.userId, type: "DEPOSIT", amount: req.validated.body.amount });
    res.status(201).json({ message: "Deposit completed.", ...out });
  } catch (e) { next(e); }
}

export async function withdraw(req, res, next) {
  try {
    const out = await adjustCash({ userId: req.user.userId, type: "WITHDRAW", amount: req.validated.body.amount });
    res.status(201).json({ message: "Withdrawal completed.", ...out });
  } catch (e) { next(e); }
}
