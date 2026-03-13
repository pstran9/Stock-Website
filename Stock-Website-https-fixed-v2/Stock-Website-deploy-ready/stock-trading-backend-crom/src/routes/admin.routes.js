import { Router } from "express";
import { z } from "zod";
import { validate } from "../shared/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as AdminController from "../controllers/admin.controller.js";

const router = Router();

function optionalNumberField(schema) {
  return z.preprocess((value) => {
    if (value === "" || value === null || typeof value === "undefined") {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, schema.optional());
}

function requiredNumberField(schema) {
  return z.preprocess((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, schema);
}

const CreateStockSchema = z.object({
  body: z.object({
    ticker: z.string().trim().min(1).max(10),
    name: z.string().trim().min(1),

    // Accept either backend-native or frontend-native field names.
    lastPrice: optionalNumberField(z.number().positive()),
    price: optionalNumberField(z.number().positive()),

    volatility: optionalNumberField(z.number().min(0).max(1)),
    drift: optionalNumberField(z.number().min(-1).max(1)),

    // Frontend sends these today; allow them for compatibility.
    sector: z.string().trim().optional(),
    priceChange: optionalNumberField(z.number()),
    percentChange: optionalNumberField(z.number()),
  }),
});

const PatchStockSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),

    lastPrice: optionalNumberField(z.number().positive()),
    price: optionalNumberField(z.number().positive()),

    volatility: optionalNumberField(z.number().min(0).max(1)),
    drift: optionalNumberField(z.number().min(-1).max(1)),

    sector: z.string().trim().optional(),
    priceChange: optionalNumberField(z.number()),
    percentChange: optionalNumberField(z.number()),
  }),
});

router.use(requireAuth, requireRole("ADMIN"));

router.post("/stocks", validate(CreateStockSchema), AdminController.createStock);
router.patch("/stocks/:ticker", validate(PatchStockSchema), AdminController.patchStock);
router.delete("/stocks/:ticker", AdminController.removeStock);

router.get("/market/status", AdminController.marketStatus);
router.get("/market/hours", AdminController.getHours);

const UpsertHoursSchema = z.object({
  body: z.object({
    dayOfWeek: requiredNumberField(z.number().int().min(1).max(5)),
    openTimeUtc: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
    closeTimeUtc: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  }),
});

router.post("/market/hours", validate(UpsertHoursSchema), AdminController.upsertHours);

export default router;
