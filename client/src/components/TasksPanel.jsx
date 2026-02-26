import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiDelete, apiGet, apiPatch, apiPost } from "../services/api";

const CATEGORIES = ["Work", "Study", "Personal", "Health", "Finance", "Chores", "Travel", "Other"];

const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  category: z.string().max(50).optional(),
  durationMin: z.coerce.number().int().min(5).max(600).optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});

function pillButtonSx() {
  return {
    borderRadius: 999,
    px: 1.75,
    py: 0.6,
    minHeight: 34,
    lineHeight: 1.1,
    fontWeight: 800,
    textTransform: "none",
    whiteSpace: "nowrap"
  };
}

export default function TasksPanel({ apiBase, onStatsChange }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("active"); // active | all | done
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: "",
      category: "Work",
      durationMin: 30,
      priority: "medium"
    }
  });

  const category = watch("category");
  const priority = watch("priority");

  async function load() {
    const data = await apiGet(apiBase, "/api/tasks");
    setTasks(data.tasks || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    return { total: tasks.length, done, active: tasks.length - done };
  }, [tasks]);

  useEffect(() => {
    onStatsChange?.(stats);
  }, [stats, onStatsChange]);

  const visibleTasks = useMemo(() => {
    if (filter === "done") return tasks.filter((t) => t.done);
    if (filter === "all") return tasks;
    return tasks.filter((t) => !t.done);
  }, [tasks, filter]);

  async function onCreate(values) {
    setSubmitting(true);

    await apiPost(apiBase, "/api/tasks", {
      title: values.title,
      category: values.category || "Work",
      durationMin: values.durationMin ?? 30,
      priority: values.priority || "medium"
    });

    reset({ title: "", category: "Work", durationMin: 30, priority: "medium" });
    await load();
    setSubmitting(false);
  }

  async function toggleDone(t) {
    await apiPatch(apiBase, `/api/tasks/${t._id}`, { done: !t.done });
    await load();
  }

  async function removeTask(id) {
    await apiDelete(apiBase, `/api/tasks/${id}`);
    await load();
  }

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid",
        borderColor: "divider",
        minWidth: 0
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2, minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={950}>
            Tasks
          </Typography>
          <Typography sx={{ opacity: 0.7 }}>
            {stats.active} active • {stats.done} done • {stats.total} total
          </Typography>
        </Box>

        {/* Filter pills */}
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_e, v) => v && setFilter(v)}
          size="small"
          sx={(t) => ({
            borderRadius: 999,
            backgroundColor: t.palette.mode === "dark" ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.04),
            p: 0.25,
            gap: 0.5,
            "& .MuiToggleButtonGroup-grouped": {
              border: 0,
              margin: 0,
              ...pillButtonSx()
            },
            "& .MuiToggleButton-root.Mui-selected": {
              backgroundColor: "primary.main",
              color: "#fff"
            }
          })}
        >
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="done">Done</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Create form */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderColor: "divider",
          mb: 2
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onCreate)}>
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              label="Task title"
              placeholder="e.g., Write project report"
              {...register("title")}
              error={!!errors.title}
              helperText={errors.title?.message}
            />

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ md: "stretch" }}
              sx={{ minWidth: 0 }}
            >
              <FormControl fullWidth sx={{ minWidth: 0 }}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  label="Category"
                  value={category || "Work"}
                  onChange={(e) => setValue("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Duration (min)"
                sx={{ width: { xs: "100%", md: 200 } }}
                {...register("durationMin")}
              />

              <FormControl sx={{ width: { xs: "100%", md: 200 } }}>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  label="Priority"
                  value={priority || "medium"}
                  onChange={(e) => setValue("priority", e.target.value)}
                >
                  <MenuItem value="low">low</MenuItem>
                  <MenuItem value="medium">medium</MenuItem>
                  <MenuItem value="high">high</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={<AddIcon />}
                sx={{
                  ...pillButtonSx(),
                  minHeight: 44,
                  px: 2,
                  minWidth: { xs: "100%", md: 140 },
                  alignSelf: { md: "center" },
                  "& .MuiButton-startIcon": { mr: 1 }
                }}
              >
                Add task
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Divider sx={{ mb: 2 }} />

      {visibleTasks.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderColor: "divider",
            textAlign: "center",
            opacity: 0.95
          }}
        >
          <Typography fontWeight={950}>No tasks here.</Typography>
          <Typography sx={{ opacity: 0.7, mt: 0.5 }}>
            Add one above — future you will pretend this was their idea.
          </Typography>
        </Paper>
      ) : (
        <Stack
          spacing={1.25}
          sx={{
            maxHeight: { xs: "unset", lg: "62vh" },
            overflow: { lg: "auto" },
            pr: { lg: 0.5 }
          }}
        >
          {visibleTasks.map((t) => (
            <Paper
              key={t._id}
              variant="outlined"
              sx={(theme) => ({
                p: { xs: 1.25, sm: 1.75 },
                borderColor: "divider",
                background: t.done
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.10)}, ${alpha(
                      theme.palette.secondary.main,
                      0.06
                    )})`
                  : "transparent",
                transition: "transform 140ms ease, background-color 140ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.03)
                      : alpha("#000000", 0.02)
                }
              })}
            >
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
                  <Checkbox checked={!!t.done} onChange={() => toggleDone(t)} sx={{ mt: -0.4 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      fontWeight={900}
                      sx={{
                        textDecoration: t.done ? "line-through" : "none",
                        opacity: t.done ? 0.55 : 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={t.title}
                    >
                      {t.title}
                    </Typography>

                    <Typography sx={{ opacity: t.done ? 0.45 : 0.75, fontSize: 12, mt: 0.75 }}>
                      {t.category || "Work"} • {t.durationMin || 30} min • {t.priority || "medium"}
                    </Typography>
                  </Box>
                </Stack>

                <Tooltip title="Delete task">
                  <IconButton onClick={() => removeTask(t._id)} size="small">
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}