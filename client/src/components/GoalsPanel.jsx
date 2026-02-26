import React, { useEffect, useState } from "react";
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiDelete, apiGet, apiPatch, apiPost } from "../services/api";

const R = 2;

export default function GoalsPanel({ apiBase }) {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  async function load() {
    const d = await apiGet(apiBase, "/api/goals");
    setGoals(d.goals || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createGoal() {
    if (!title.trim()) return;
    await apiPost(apiBase, "/api/goals", { title: title.trim(), description: desc.trim() });
    setTitle("");
    setDesc("");
    await load();
  }

  async function setProgress(g, progress) {
    await apiPatch(apiBase, `/api/goals/${g._id}`, { progress });
    await load();
  }

  async function markDone(g) {
    await apiPatch(apiBase, `/api/goals/${g._id}`, { status: g.status === "done" ? "active" : "done" });
    await load();
  }

  async function remove(g) {
    await apiDelete(apiBase, `/api/goals/${g._id}`);
    await load();
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography fontWeight={900} sx={{ mb: 1.5 }}>
        Goals
      </Typography>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: R, borderColor: "divider", mb: 2 }}>
        <Stack spacing={1}>
          <TextField
            size="small"
            fullWidth
            label="Goal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            InputProps={{ sx: { borderRadius: R } }}
          />
          <TextField
            size="small"
            fullWidth
            label="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            InputProps={{ sx: { borderRadius: R } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: R }} onClick={createGoal}>
            Add goal
          </Button>
        </Stack>
      </Paper>

      {goals.length === 0 ? (
        <Typography sx={{ opacity: 0.7 }}>No goals yet.</Typography>
      ) : (
        <Stack spacing={1}>
          {goals.map((g) => (
            <Paper key={g._id} variant="outlined" sx={{ p: 1.5, borderRadius: R, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900} sx={{ opacity: g.status === "done" ? 0.6 : 1 }}>
                    {g.title}
                  </Typography>
                  {g.description ? (
                    <Typography sx={{ opacity: 0.75, fontSize: 13, mt: 0.5 }}>{g.description}</Typography>
                  ) : null}

                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
                    <Chip size="small" label={`Progress: ${g.progress || 0}%`} variant="outlined" />
                    <Chip size="small" label={g.status} variant="outlined" />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.25 }}>
                    <TextField
                      size="small"
                      label="Progress %"
                      type="number"
                      value={g.progress || 0}
                      onChange={(e) => setProgress(g, Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                      InputProps={{ sx: { borderRadius: R } }}
                      sx={{ width: { xs: "100%", sm: 160 } }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: R }}
                      onClick={() => markDone(g)}
                    >
                      {g.status === "done" ? "Mark active" : "Mark done"}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: R }}
                      onClick={() => remove(g)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}