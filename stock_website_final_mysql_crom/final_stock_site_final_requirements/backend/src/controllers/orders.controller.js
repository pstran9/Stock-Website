import * as Orders from "../repositories/orders.repo.js";

export async function list(req, res, next) {
  try { res.json({ orders: await Orders.listOrders(req.user.userId) }); }
  catch (e) { next(e); }
}

export async function create(req, res, next) {
  try {
    const out = await Orders.createOrder({ userId: req.user.userId, ...req.validated.body });
    res.status(201).json({ message: "Order created and waiting for execution.", ...out });
  } catch (e) { next(e); }
}

export async function cancel(req, res, next) {
  try {
    const n = await Orders.cancelOrder({ userId: req.user.userId, orderId: Number(req.params.id) });
    if (!n) return res.status(404).json({ error: "Pending order not found" });
    res.json({ message: "Order cancelled successfully." });
  } catch (e) { next(e); }
}
