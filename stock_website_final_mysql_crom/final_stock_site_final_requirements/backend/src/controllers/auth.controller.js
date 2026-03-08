import * as Auth from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const out = await Auth.register(req.validated.body);
    res.status(201).json(out);
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const out = await Auth.login(req.validated.body);
    res.json(out);
  } catch (e) { next(e); }
}
