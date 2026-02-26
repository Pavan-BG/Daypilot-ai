import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Tooltip
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import { apiGet } from "../services/api";

const WORK_START = 9 * 60;
const WORK_END = 18 * 60;
const BUFFER = 10;

function pad2(n) {
  return String(n).padStart(2, "0");
}
function minToHHMM(m) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}
function hhmmToMin(v) {
  if (!v || typeof v !== "string") return 0;
  const [h, m] = v.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.max(0, Math.min(1439, h * 60 + m));
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function prettyDate(ymd) {
  try {
    const [y, m, d] = String(ymd).split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(dt);
  } catch {
    return ymd || "—";
  }
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    const last = out[out.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

function findSlot(occupied, durationMin, start = WORK_START, end = WORK_END) {
  const need = durationMin + BUFFER;
  const merged = mergeIntervals(
    occupied.map(([s, e]) => [clamp(s, 0, 1440), clamp(e, 0, 1440)])
  );

  let cur = start;

  for (const [s, e] of merged) {
    if (e <= cur) continue;

    if (s > cur) {
      if (cur + need <= s && cur + durationMin <= end) return cur;
      cur = e;
    } else {
      cur = Math.max(cur, e);
    }

    if (cur >= end) break;
  }

  if (cur + durationMin <= end) return cur;
  return null;
}

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

async function apiPut(apiBase, path, body) {
  const r = await fetch(`${apiBase}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || "Request failed");
  return data;
}

// Pull calendar busy time for the selected date (primary calendar)
async function loadDayEvents(apiBase, dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();

  const url =
    `/api/calendar/range?calendarId=${encodeURIComponent("primary")}` +
    `&timeMin=${encodeURIComponent(start)}` +
    `&timeMax=${encodeURIComponent(end)}`;

  const data = await apiGet(apiBase, url);
  return data?.events || [];
}

function eventToInterval(e) {
  if (typeof e.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.start)) return [0, 1440];
  const s = new Date(e.start);
  const en = new Date(e.end || e.start);
  if (Number.isNaN(s.getTime())) return null;

  const startMin = s.getHours() * 60 + s.getMinutes();
  const endMin = Number.isNaN(en.getTime())
    ? startMin + 30
    : en.getHours() * 60 + en.getMinutes();

  return [clamp(startMin, 0, 1440), clamp(Math.max(endMin, startMin + 5), 0, 1440)];
}

function validateNoOverlap(blocks) {
  const sorted = [...blocks].sort((a, b) => (a.startMin || 0) - (b.startMin || 0));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const prevEnd = (prev.startMin || 0) + (prev.durationMin || 30);
    if ((cur.startMin || 0) < prevEnd) {
      return `Overlap: "${prev.title}" overlaps "${cur.title}"`;
    }
  }
  return "";
}

export default function DayPlanPanel({ apiBase, selectedDate, dateKey }) {
  const activeDateKey = dateKey || selectedDate || "";

  const [planBlocks, setPlanBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newDur, setNewDur] = useState(30);

  const sortedBlocks = useMemo(() => {
    return [...planBlocks].sort((a, b) => (a.startMin || 0) - (b.startMin || 0));
  }, [planBlocks]);

  const totalMin = useMemo(
    () => sortedBlocks.reduce((sum, b) => sum + Number(b.durationMin || 0), 0),
    [sortedBlocks]
  );

  function markDirty(next) {
    setPlanBlocks(next);
    setDirty(true);
  }

  async function loadAll() {
    if (!activeDateKey) return;
    setLoading(true);
    setErr("");
    setInfo("");

    try {
      const p = await apiGet(apiBase, `/api/dayplan?date=${encodeURIComponent(activeDateKey)}`);
      setPlanBlocks(p?.blocks || []);
      setDirty(false);

      const t = await apiGet(apiBase, "/api/tasks");
      setTasks((t?.tasks || []).filter((x) => !x.done));

      setLoading(false);
    } catch (e) {
      setErr(e?.message || "Failed to load day plan");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDateKey]);

  async function savePlan() {
    if (!activeDateKey) return;
    setSaving(true);
    setErr("");
    setInfo("");

    try {
      const overlapMsg = validateNoOverlap(sortedBlocks);
      if (overlapMsg) {
        setErr(overlapMsg);
        setSaving(false);
        return;
      }

      const payload = {
        blocks: sortedBlocks.map((b) => ({
          id: b.id || uuid(),
          startMin: clamp(Number(b.startMin || 0), 0, 1439),
          durationMin: clamp(Number(b.durationMin || 30), 5, 600),
          title: String(b.title || "").slice(0, 120),
          source: b.source || "manual",
          taskId: b.taskId || null,
          locked: !!b.locked
        }))
      };

      const saved = await apiPut(apiBase, `/api/dayplan?date=${encodeURIComponent(activeDateKey)}`, payload);

      setPlanBlocks(saved?.blocks || payload.blocks);
      setDirty(false);
      setInfo("Saved.");
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function removeBlock(idx) {
    const next = [...sortedBlocks];
    next.splice(idx, 1);
    markDirty(next);
  }

  function toggleLock(idx) {
    const next = [...sortedBlocks];
    next[idx] = { ...next[idx], locked: !next[idx].locked };
    markDirty(next);
  }

  function updateBlock(idx, patch) {
    const next = [...sortedBlocks];
    next[idx] = { ...next[idx], ...patch };
    markDirty(next);
  }

  function addManualBlock() {
    const title = newTitle.trim();
    if (!title) {
      setErr("Title is required to add a block.");
      return;
    }

    const startMin = hhmmToMin(newStart);
    const durationMin = clamp(Number(newDur || 30), 5, 600);

    markDirty([
      ...sortedBlocks,
      { id: uuid(), title, startMin, durationMin, source: "manual", locked: false, taskId: null }
    ]);

    setNewTitle("");
    setInfo("Block added (not saved yet).");
  }

  async function scheduleTask(task) {
    setErr("");
    setInfo("");

    try {
      const occupied = sortedBlocks.map((b) => [b.startMin, b.startMin + b.durationMin]);

      let calEvents = [];
      try {
        calEvents = await loadDayEvents(apiBase, activeDateKey);
      } catch {
        // soft fail
      }

      for (const e of calEvents) {
        const it = eventToInterval(e);
        if (it) occupied.push(it);
      }

      const dur = clamp(Number(task.durationMin || 30), 5, 600);
      const slot = findSlot(occupied, dur, WORK_START, WORK_END);

      if (slot === null) {
        const lastEnd = occupied.length ? Math.max(...occupied.map((x) => x[1])) : WORK_START;
        const startMin = clamp(lastEnd + BUFFER, 0, 1439);

        markDirty([
          ...sortedBlocks,
          { id: uuid(), title: task.title, startMin, durationMin: dur, source: "task", taskId: task._id, locked: false }
        ]);

        setInfo("No free slot in work hours — scheduled after last block.");
        return;
      }

      markDirty([
        ...sortedBlocks,
        { id: uuid(), title: task.title, startMin: slot, durationMin: dur, source: "task", taskId: task._id, locked: false }
      ]);

      setInfo("Task scheduled (not saved yet).");
    } catch (e) {
      setErr(e?.message || "Failed to schedule task");
    }
  }

  const activeTasks = useMemo(() => tasks.slice(0, 6), [tasks]);

  const statusLabel = !activeDateKey
    ? "Select a day"
    : saving
    ? "Saving…"
    : loading
    ? "Loading…"
    : dirty
    ? "Unsaved"
    : "Synced";

  return (
    <Paper
      sx={(t) => ({
        p: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        minWidth: 0,
        overflow: "hidden",
        background:
          t.palette.mode === "dark"
            ? `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.06)}, ${alpha("#000000", 0.06)})`
            : `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.04)}, ${alpha("#FFFFFF", 0.70)})`
      })}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1.25}
        sx={{ mb: 1.5, flexWrap: "wrap", rowGap: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            <Typography fontWeight={950}>Day Plan</Typography>
            <Chip
              size="small"
              label={statusLabel}
              variant={dirty ? "filled" : "outlined"}
              color={dirty ? "warning" : "default"}
              sx={{ height: 22 }}
            />
          </Stack>

          <Typography sx={{ opacity: 0.75, fontSize: 12, mt: 0.4 }}>
            {activeDateKey
              ? `${prettyDate(activeDateKey)} • ${sortedBlocks.length} blocks • ${totalMin} min`
              : "Select a day in the calendar"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap", rowGap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAll}
            disabled={loading || saving || !activeDateKey}
          >
            Refresh
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={savePlan}
            disabled={saving || !dirty || !activeDateKey}
          >
            Save
          </Button>
        </Stack>
      </Stack>

      {/* Messages */}
      {err ? (
        <Paper
          variant="outlined"
          sx={(t) => ({
            p: 1.25,
            borderColor: "divider",
            mb: 1.25,
            backgroundColor: t.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02)
          })}
        >
          <Typography fontWeight={950}>Issue</Typography>
          <Typography sx={{ opacity: 0.8, fontSize: 13, mt: 0.25 }}>{err}</Typography>
        </Paper>
      ) : null}

      {info ? (
        <Typography sx={{ opacity: 0.75, fontSize: 12, mb: 1.25 }}>{info}</Typography>
      ) : null}

      {/* Add block */}
      <Paper
        variant="outlined"
        sx={(t) => ({
          p: 1.5,
          borderColor: "divider",
          mb: 1.75,
          backgroundColor: t.palette.mode === "dark" ? alpha("#FFFFFF", 0.02) : alpha("#000000", 0.015)
        })}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
          <Typography fontWeight={950}>Add block</Typography>
          <Typography sx={{ opacity: 0.65, fontSize: 12 }}>
            Work hours: {minToHHMM(WORK_START)}–{minToHHMM(WORK_END)} • Buffer {BUFFER}m
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gap: 1,
            alignItems: "center",
            minWidth: 0
          }}
        >
          <TextField
            size="small"
            fullWidth
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addManualBlock();
            }}
            sx={{ gridColumn: "1 / -1", minWidth: 0 }}
          />

          <TextField
            size="small"
            label="Start"
            type="time"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            sx={{ gridColumn: { xs: "1 / -1", sm: "1 / span 5" }, minWidth: 0 }}
          />

          <TextField
            size="small"
            label="Minutes"
            type="number"
            value={newDur}
            onChange={(e) => setNewDur(e.target.value)}
            sx={{ gridColumn: { xs: "1 / -1", sm: "6 / span 4" }, minWidth: 0 }}
          />

          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addManualBlock}
            disabled={!activeDateKey}
            fullWidth
            sx={{ gridColumn: { xs: "1 / -1", sm: "10 / span 3" }, whiteSpace: "nowrap", height: 40 }}
          >
            Add
          </Button>
        </Box>
      </Paper>

      {/* Blocks */}
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography fontWeight={950}>Blocks</Typography>
        <Typography sx={{ opacity: 0.65, fontSize: 12 }}>
          {sortedBlocks.length ? "Edit times/titles, lock if needed" : "No blocks yet"}
        </Typography>
      </Stack>

      {sortedBlocks.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, borderColor: "divider", mb: 2 }}>
          <Typography fontWeight={950}>No blocks yet.</Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5, fontSize: 13 }}>
            Add one above or schedule from tasks.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {sortedBlocks.map((b, idx) => (
            <Paper
              key={b.id || `${b.title}-${idx}`}
              variant="outlined"
              sx={(t) => ({
                p: 1.25,
                borderColor: "divider",
                backgroundColor: b.locked ? alpha(t.palette.primary.main, 0.10) : "transparent",
                transition: "transform 140ms ease, background-color 140ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  backgroundColor: b.locked
                    ? alpha(t.palette.primary.main, 0.12)
                    : t.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.03)
                    : alpha("#000000", 0.02)
                }
              })}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "130px 110px minmax(0,1fr) auto" },
                  gap: 1,
                  alignItems: "center"
                }}
              >
                <TextField
                  size="small"
                  label="Time"
                  type="time"
                  value={minToHHMM(clamp(Number(b.startMin || 0), 0, 1439))}
                  onChange={(e) => updateBlock(idx, { startMin: hhmmToMin(e.target.value) })}
                  disabled={!!b.locked}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />

                <TextField
                  size="small"
                  label="Min"
                  type="number"
                  value={Number(b.durationMin || 30)}
                  onChange={(e) => updateBlock(idx, { durationMin: clamp(Number(e.target.value || 30), 5, 600) })}
                  disabled={!!b.locked}
                />

                <TextField
                  size="small"
                  label="Title"
                  fullWidth
                  value={b.title || ""}
                  onChange={(e) => updateBlock(idx, { title: e.target.value })}
                  disabled={!!b.locked}
                />

                <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                  <Tooltip title={b.locked ? "Unlock" : "Lock"}>
                    <IconButton onClick={() => toggleLock(idx)} size="small">
                      {b.locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton onClick={() => removeBlock(idx)} size="small">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.75 }}>
                <Chip size="small" label={b.source || "manual"} variant="outlined" sx={{ height: 22, opacity: 0.95 }} />
                {b.taskId ? <Chip size="small" label="linked task" variant="outlined" sx={{ height: 22, opacity: 0.95 }} /> : null}
                {b.locked ? <Chip size="small" label="locked" variant="filled" color="secondary" sx={{ height: 22, opacity: 0.95 }} /> : null}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 1.75 }} />

      {/* Tasks backlog */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography fontWeight={950}>Schedule from Tasks</Typography>
        <Chip size="small" label={`${tasks.length} active`} variant="outlined" sx={{ height: 22, opacity: 0.95 }} />
      </Stack>

      {activeTasks.length === 0 ? (
        <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No active tasks to schedule.</Typography>
      ) : (
        <Stack spacing={1}>
          {activeTasks.map((t) => (
            <Paper
              key={t._id}
              variant="outlined"
              sx={(theme) => ({
                p: 1.25,
                borderColor: "divider",
                transition: "transform 140ms ease, background-color 140ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  backgroundColor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02)
                }
              })}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={950} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </Typography>
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                    {t.category || "General"} • {t.durationMin || 30} min • {t.priority || "medium"}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlayCircleOutlineIcon />}
                  onClick={() => scheduleTask(t)}
                  disabled={!activeDateKey}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Schedule
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}