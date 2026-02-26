const express = require("express");
const { z } = require("zod");
const JournalEntry = require("../models/JournalEntry");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

const YmdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const CreateSchema = z.object({
  dateKey: YmdSchema,
  title: z.string().max(120).optional().default(""),
  content: z.string().min(1).max(5000)
});

const PatchSchema = z.object({
  title: z.string().max(120).optional(),
  content: z.string().min(1).max(5000).optional()
});

router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "30", 10), 200);
  const entries = await JournalEntry.find({ userId: req.user.id })
    .sort({ dateKey: -1, createdAt: -1 })
    .limit(limit);

  res.json({ entries });
});

router.post("/", async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const e = await JournalEntry.create({
    userId: req.user.id,
    dateKey: parsed.data.dateKey,
    title: parsed.data.title,
    content: parsed.data.content
  });

  res.status(201).json({ entry: e });
});

router.patch("/:id", async (req, res) => {
  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const entry = await JournalEntry.findOne({ _id: req.params.id, userId: req.user.id });
  if (!entry) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  Object.assign(entry, parsed.data);
  await entry.save();

  res.json({ entry });
});

router.delete("/:id", async (req, res) => {
  const r = await JournalEntry.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ ok: r.deletedCount === 1 });
});

module.exports = router;