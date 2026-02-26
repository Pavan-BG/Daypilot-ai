const express = require("express");
const { z } = require("zod");
const Goal = require("../models/Goal");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

const CreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().default(""),
  targetDate: z.string().datetime().nullable().optional().default(null)
});

const PatchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  targetDate: z.string().datetime().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["active", "done"]).optional()
});

router.get("/", async (req, res) => {
  const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ goals });
});

router.post("/", async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const g = await Goal.create({
    userId: req.user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null
  });

  res.status(201).json({ goal: g });
});

router.patch("/:id", async (req, res) => {
  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
  if (!goal) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  if ("targetDate" in parsed.data) {
    goal.targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
    delete parsed.data.targetDate;
  }

  Object.assign(goal, parsed.data);
  await goal.save();

  res.json({ goal });
});

router.delete("/:id", async (req, res) => {
  const r = await Goal.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ ok: r.deletedCount === 1 });
});

module.exports = router;