import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Checkbox, Paper, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiDelete, apiGet, apiPost } from "../services/api";

const R = 2;

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function HabitsPanel({ apiBase }) {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");

  const dk = useMemo(() => todayKey(), []);

  async function load() {
    const d = await apiGet(apiBase, "/api/habits");
    setHabits(d.habits || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createHabit() {
    setErr("");
    if (!title.trim()) return setErr("Habit title is required.");
    await apiPost(apiBase, "/api/habits", { title: title.trim() });
    setTitle("");
    await load();
  }

  async function toggle(h) {
    await apiPost(apiBase, `/api/habits/${h._id}/toggle`, { dateKey: dk });
    await load();
  }

  async function remove(id) {
    await apiDelete(apiBase, `/api/habits/${id}`);
    await load();
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
        <Typography fontWeight={900}>Habits</Typography>
        <Typography sx={{ opacity: 0.7, fontSize: 12 }}>{dk}</Typography>
      </Stack>

      {err ? (
        <Paper variant="outlined" sx={{ p: 1.25, borderRadius: R, borderColor: "divider", mb: 1.25 }}>
          <Typography fontWeight={900}>Issue</Typography>
          <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{err}</Typography>
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: R, borderColor: "divider", mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            label="New habit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            InputProps={{ sx: { borderRadius: R } }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: R, whiteSpace: "nowrap" }}
            onClick={createHabit}
          >
            Add
          </Button>
        </Stack>
      </Paper>

      {habits.length === 0 ? (
        <Typography sx={{ opacity: 0.7 }}>No habits yet.</Typography>
      ) : (
        <Stack spacing={1}>
          {habits.map((h) => {
            const done = (h.completions || []).includes(dk);
            return (
              <Paper key={h._id} variant="outlined" sx={{ p: 1.25, borderRadius: R, borderColor: "divider" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Checkbox checked={done} onChange={() => toggle(h)} />
                    <Typography fontWeight={900} sx={{ opacity: done ? 0.55 : 1 }}>
                      {h.title}
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ borderRadius: R, whiteSpace: "nowrap" }}
                    onClick={() => remove(h._id)}
                  >
                    Delete
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}