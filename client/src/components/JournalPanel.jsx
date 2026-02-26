import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { apiDelete, apiGet, apiPost } from "../services/api";

const R = 2;

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function JournalPanel({ apiBase }) {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [err, setErr] = useState("");

  const dk = useMemo(() => todayKey(), []);

  async function load() {
    const d = await apiGet(apiBase, "/api/journal?limit=50");
    setEntries(d.entries || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEntry() {
    setErr("");
    if (!content.trim()) return setErr("Content is required.");
    await apiPost(apiBase, "/api/journal", {
      dateKey: dk,
      title: title.trim(),
      content: content.trim()
    });
    setTitle("");
    setContent("");
    await load();
  }

  async function remove(id) {
    await apiDelete(apiBase, `/api/journal/${id}`);
    await load();
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
        <Typography fontWeight={900}>Journal</Typography>
        <Typography sx={{ opacity: 0.7, fontSize: 12 }}>{dk}</Typography>
      </Stack>

      {err ? (
        <Paper variant="outlined" sx={{ p: 1.25, borderRadius: R, borderColor: "divider", mb: 1.25 }}>
          <Typography fontWeight={900}>Issue</Typography>
          <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{err}</Typography>
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: R, borderColor: "divider", mb: 2 }}>
        <Stack spacing={1}>
          <TextField
            size="small"
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            InputProps={{ sx: { borderRadius: R } }}
          />
          <TextField
            label="Write a quick entry"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            minRows={4}
            InputProps={{ sx: { borderRadius: R } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: R }} onClick={addEntry}>
            Add entry
          </Button>
        </Stack>
      </Paper>

      {entries.length === 0 ? (
        <Typography sx={{ opacity: 0.7 }}>No journal entries yet.</Typography>
      ) : (
        <Stack spacing={1}>
          {entries.map((e) => (
            <Paper key={e._id} variant="outlined" sx={{ p: 1.5, borderRadius: R, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900}>
                    {e.title?.trim() ? e.title : "(Untitled)"}{" "}
                    <Typography component="span" sx={{ opacity: 0.65, fontSize: 12 }}>
                      • {e.dateKey}
                    </Typography>
                  </Typography>
                  <Typography sx={{ opacity: 0.8, mt: 0.75, whiteSpace: "pre-wrap" }}>
                    {e.content}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteOutlineIcon />}
                  sx={{ borderRadius: R, whiteSpace: "nowrap", height: 34 }}
                  onClick={() => remove(e._id)}
                >
                  Delete
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}