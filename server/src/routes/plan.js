const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/requireAuth");
const Plan = require("../models/Plan");

const router = express.Router();
router.use(requireAuth);

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const BlockSchema = z.object({
  startMin: z.number().int().min(0).max(1439),
  durationMin: z.number().int().min(5).max(600),
  title: z.string().min(1).max(120),

  source: z.enum(["task", "manual", "calendar"]).optional().default("manual"),
  taskId: z.string().nullable().optional().default(null),
  locked: z.boolean().optional().default(false)
});

const PutPlanSchema = z.object({
  blocks: z.array(BlockSchema).default([])
});

function sortAndNormalize(blocks) {
  // sort by startMin
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);

  // clip end time (soft)
  return sorted.map((b) => {
    const start = Math.max(0, Math.min(1439, b.startMin));
    const dur = Math.max(5, Math.min(600, b.durationMin));
    return { ...b, startMin: start, durationMin: dur };
  });
}

// GET /api/plan?date=YYYY-MM-DD
router.get("/", async (req, res) => {
  const parsedDate = DateSchema.safeParse(req.query.date);
  if (!parsedDate.success) {
    return res.status(400).json({
      error: { code: "VALIDATION", message: parsedDate.error.issues?.[0]?.message || "Invalid date" }
    });
  }

  const date = parsedDate.data;

  const plan = await Plan.findOne({ userId: req.user.id, date }).lean();
  res.json({
    date,
    plan: plan ? { id: String(plan._id), date: plan.date, blocks: plan.blocks || [] } : null
  });
});

// PUT /api/plan?date=YYYY-MM-DD  body: { blocks: [...] }
router.put("/", async (req, res) => {
  const parsedDate = DateSchema.safeParse(req.query.date);
  if (!parsedDate.success) {
    return res.status(400).json({
      error: { code: "VALIDATION", message: parsedDate.error.issues?.[0]?.message || "Invalid date" }
    });
  }
  const date = parsedDate.data;

  const parsedBody = PutPlanSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsedBody.error.flatten() } });
  }

  const blocks = sortAndNormalize(parsedBody.data.blocks || []);

  const updated = await Plan.findOneAndUpdate(
    { userId: req.user.id, date },
    { $set: { blocks } },
    { new: true, upsert: true }
  );

  res.json({
    date,
    plan: { id: String(updated._id), date: updated.date, blocks: updated.blocks || [] }
  });
});

module.exports = router;
