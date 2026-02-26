const express = require("express");
const { z } = require("zod");
const crypto = require("crypto");
const mongoose = require("mongoose");
const DayPlan = require("../models/DayPlan");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

const DateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const BlockSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1).max(120),
  startMin: z.coerce.number().int().min(0).max(1439),
  durationMin: z.coerce.number().int().min(5).max(600),
  source: z.enum(["manual", "task"]).optional().default("manual"),
  taskId: z.string().optional().nullable(),
  locked: z.coerce.boolean().optional().default(false)
});

const SaveSchema = z.object({
  blocks: z.array(BlockSchema).optional().default([])
});

function normalizeAndValidateBlocks(blocks) {
  const normalized = blocks
    .map((b) => ({
      id: b.id || crypto.randomUUID(),
      title: String(b.title || "").trim(),
      startMin: b.startMin,
      durationMin: b.durationMin,
      source: b.source || "manual",
      // Defensive: accept only valid ObjectId strings (or null)
      taskId: b.taskId && mongoose.Types.ObjectId.isValid(b.taskId) ? b.taskId : null,
      locked: !!b.locked
    }))
    .sort((a, b) => a.startMin - b.startMin);

  // titles cannot be empty after trim
  for (const b of normalized) {
    if (!b.title) {
      return { ok: false, code: "VALIDATION", message: "Block title cannot be empty" };
    }
  }

  // no overlaps
  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1];
    const cur = normalized[i];
    const prevEnd = prev.startMin + prev.durationMin;
    if (cur.startMin < prevEnd) {
      return {
        ok: false,
        code: "OVERLAP",
        message: `Blocks overlap: "${prev.title}" overlaps "${cur.title}"`
      };
    }
  }

  return { ok: true, blocks: normalized };
}

// GET /api/dayplan?date=YYYY-MM-DD
router.get("/", async (req, res) => {
  const date = DateKeySchema.safeParse(req.query.date);
  if (!date.success) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "Invalid date" } });
  }

  const plan = await DayPlan.findOne({ userId: req.user.id, dateKey: date.data }).lean();
  return res.json({ dateKey: date.data, blocks: plan?.blocks || [] });
});

// PUT /api/dayplan?date=YYYY-MM-DD
router.put("/", async (req, res) => {
  const date = DateKeySchema.safeParse(req.query.date);
  if (!date.success) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "Invalid date" } });
  }

  const parsed = SaveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "VALIDATION", message: "Invalid payload", details: parsed.error.flatten() }
    });
  }

  const check = normalizeAndValidateBlocks(parsed.data.blocks);
  if (!check.ok) {
    return res.status(400).json({ error: { code: check.code || "VALIDATION", message: check.message } });
  }

  const updated = await DayPlan.findOneAndUpdate(
    { userId: req.user.id, dateKey: date.data },
    { $set: { blocks: check.blocks } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  // Return the normalized blocks we just persisted.
  // This avoids any accidental partial response shape that could cause the client to drop titles.
  return res.json({ dateKey: updated?.dateKey || date.data, blocks: check.blocks });
});

module.exports = router;