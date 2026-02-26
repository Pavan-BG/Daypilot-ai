const express = require("express");
const { z } = require("zod");
const Habit = require("../models/Habit");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

const YmdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const CreateHabitSchema = z.object({
  title: z.string().min(1).max(80)
});

const PatchHabitSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  archived: z.boolean().optional()
});

router.get("/", async (req, res) => {
  const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ habits });
});

router.post("/", async (req, res) => {
  const parsed = CreateHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const habit = await Habit.create({
    userId: req.user.id,
    title: parsed.data.title,
    completions: []
  });

  res.status(201).json({ habit });
});

router.patch("/:id", async (req, res) => {
  const parsed = PatchHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
  if (!habit) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  Object.assign(habit, parsed.data);
  await habit.save();
  res.json({ habit });
});

router.delete("/:id", async (req, res) => {
  const r = await Habit.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ ok: r.deletedCount === 1 });
});

// Toggle completion for a dateKey
router.post("/:id/toggle", async (req, res) => {
  const parsedDate = YmdSchema.safeParse(req.body?.dateKey);
  if (!parsedDate.success) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "dateKey must be YYYY-MM-DD" } });
  }

  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
  if (!habit) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  const dk = parsedDate.data;
  const set = new Set(habit.completions || []);
  if (set.has(dk)) set.delete(dk);
  else set.add(dk);

  habit.completions = Array.from(set).sort(); // keep stable
  await habit.save();

  res.json({ habit });
});

module.exports = router;