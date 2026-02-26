const express = require("express");
const { z } = require("zod");
const Task = require("../models/Task");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

// YYYY-MM-DD validation (simple + safe)
const DateYmd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime());
  }, "Invalid date");

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().max(50).optional().default("General"),
  durationMin: z.coerce.number().int().min(5).max(600).optional().default(30),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  deadline: z.string().datetime().nullable().optional().default(null),

  // ✅ NEW
  scheduledDate: DateYmd.nullable().optional().default(null)
});

const PatchTaskSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    category: z.string().max(50).optional(),
    durationMin: z.coerce.number().int().min(5).max(600).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    done: z.coerce.boolean().optional(),
    deadline: z.string().datetime().nullable().optional(),

    // ✅ NEW
    scheduledDate: DateYmd.nullable().optional()
  })
  .strict();

router.get("/", async (req, res) => {
  // Supports:
  //  - GET /api/tasks                -> all tasks
  //  - GET /api/tasks?date=YYYY-MM-DD -> tasks scheduled for that day
  //  - GET /api/tasks?unscheduled=1   -> tasks with no scheduledDate
  const qDate = req.query.date;
  const unscheduled =
    req.query.unscheduled === "1" || req.query.unscheduled === "true";

  const filter = { userId: req.user.id };

  if (unscheduled) {
    filter.scheduledDate = null;
  } else if (qDate) {
    const parsedDate = DateYmd.safeParse(qDate);
    if (!parsedDate.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION",
          message: "Invalid date query param",
          details: parsedDate.error.flatten()
        }
      });
    }
    filter.scheduledDate = parsedDate.data;
  }

  const tasks = await Task.find(filter).sort({ done: 1, createdAt: -1 });
  res.json({ tasks });
});

router.post("/", async (req, res) => {
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const d = parsed.data;

  const task = await Task.create({
    userId: req.user.id,
    title: d.title,
    category: d.category,
    durationMin: d.durationMin,
    priority: d.priority,
    deadline: d.deadline ? new Date(d.deadline) : null,
    scheduledDate: d.scheduledDate ?? null
  });

  res.status(201).json({ task });
});

router.patch("/:id", async (req, res) => {
  const parsed = PatchTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", details: parsed.error.flatten() } });
  }

  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) return res.status(404).json({ error: { code: "NOT_FOUND" } });

  const d = parsed.data;

  if ("title" in d) task.title = d.title;
  if ("category" in d) task.category = d.category;
  if ("durationMin" in d) task.durationMin = d.durationMin;
  if ("priority" in d) task.priority = d.priority;
  if ("done" in d) task.done = d.done;

  if ("deadline" in d) task.deadline = d.deadline ? new Date(d.deadline) : null;

  // ✅ NEW
  if ("scheduledDate" in d) task.scheduledDate = d.scheduledDate ?? null;

  await task.save();
  res.json({ task });
});

router.delete("/:id", async (req, res) => {
  const r = await Task.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ ok: r.deletedCount === 1 });
});

module.exports = router;
