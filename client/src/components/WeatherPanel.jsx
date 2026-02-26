import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

function formatTemp(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${Math.round(v)}°`;
}

function toLocalHour(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(d);
  } catch {
    return "";
  }
}

async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,wind_speed_10m` +
    `&hourly=temperature_2m,precipitation_probability` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&forecast_days=2&timezone=auto`;

  const r = await fetch(url);
  if (!r.ok) throw new Error("Weather fetch failed");
  return r.json();
}

async function reverseGeocode(lat, lon) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

  const r = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Language": "en" }
  });

  if (!r.ok) throw new Error(`Reverse geocode failed (${r.status})`);
  const json = await r.json();

  const a = json.address || {};
  const city = a.city || a.town || a.village || a.suburb || a.county || a.state_district || json.name || "";
  const state = a.state || "";
  const cc = (a.country_code || "").toUpperCase();

  const parts = [city, state].filter(Boolean);
  const label = parts.length ? parts.join(", ") : "Your location";
  return cc ? `${label} • ${cc}` : label;
}

async function geocodeCity(name) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}` +
    `&count=1&language=en&format=json`;

  const r = await fetch(url);
  if (!r.ok) throw new Error("City geocoding failed");
  const json = await r.json();

  const top = json?.results?.[0];
  if (!top) throw new Error("City not found");

  const labelParts = [top.name, top.admin1].filter(Boolean);
  const cc = (top.country_code || "").toUpperCase();
  const label = labelParts.join(", ");
  return { lat: top.latitude, lon: top.longitude, label: cc ? `${label} • ${cc}` : label };
}

export default function WeatherPanel({ defaultCity = "Bengaluru" }) {
  const [status, setStatus] = useState("loading"); // loading | ready | denied | error
  const [pos, setPos] = useState(null); // {lat, lon, source}
  const [placeLabel, setPlaceLabel] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const hourlyChips = useMemo(() => {
    if (!data?.hourly?.time?.length) return [];
    const now = Date.now();

    const out = [];
    for (let i = 0; i < data.hourly.time.length && out.length < 8; i++) {
      const t = new Date(data.hourly.time[i]).getTime();
      if (t >= now) {
        out.push({
          time: data.hourly.time[i],
          temp: data.hourly.temperature_2m?.[i],
          pop: data.hourly.precipitation_probability?.[i]
        });
      }
    }
    return out;
  }, [data]);

  async function load(lat, lon, { updatePlace = true } = {}) {
    try {
      setStatus("loading");
      setErr("");

      const weather = await fetchWeather(lat, lon);
      setData(weather);

      if (updatePlace) {
        try {
          const label = await reverseGeocode(lat, lon);
          setPlaceLabel(label);
        } catch {
          setPlaceLabel(`Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`);
        }
      }

      setStatus("ready");
    } catch (e) {
      setErr(e?.message || "Weather error");
      setStatus("error");
    }
  }

  function requestLocation() {
    setErr("");
    if (!navigator.geolocation) {
      setStatus("error");
      setErr("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lon = p.coords.longitude;

        setPos({ lat, lon, source: "gps" });
        setPlaceLabel("Detecting location…");

        await load(lat, lon, { updatePlace: true });
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  async function useFallbackCity() {
    try {
      setStatus("loading");
      setErr("");

      const g = await geocodeCity(defaultCity);
      setPos({ lat: g.lat, lon: g.lon, source: "city" });
      setPlaceLabel(g.label);

      await load(g.lat, g.lon, { updatePlace: false });
    } catch (e) {
      setStatus("error");
      setErr(e?.message || "Failed to load default city weather.");
    }
  }

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = data?.current || {};
  const daily = data?.daily || {};
  const tMax = daily.temperature_2m_max?.[0];
  const tMin = daily.temperature_2m_min?.[0];

  return (
    <Paper
      sx={(t) => ({
        minWidth: 0,
        p: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        background:
          t.palette.mode === "dark"
            ? `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.10)}, ${alpha("#000000", 0.10)})`
            : `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.06)}, ${alpha("#FFFFFF", 0.70)})`
      })}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={950}>Weather</Typography>

          <Typography
            sx={{
              opacity: 0.75,
              fontSize: 12,
              mt: 0.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: { xs: 220, sm: 320, md: 420 }
            }}
            title={placeLabel || (status === "denied" ? `Default city: ${defaultCity}` : "")}
          >
            {placeLabel ||
              (status === "denied"
                ? `Default city: ${defaultCity}`
                : status === "loading"
                ? "Loading…"
                : "—")}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          sx={{ borderRadius: 999, whiteSpace: "nowrap" }}
          onClick={() => {
            if (pos?.lat && pos?.lon) {
              load(pos.lat, pos.lon, { updatePlace: pos.source === "gps" });
            } else {
              requestLocation();
            }
          }}
        >
          Refresh
        </Button>
      </Stack>

      <Box sx={{ mt: 2 }}>
        {status === "denied" ? (
          <Paper variant="outlined" sx={{ p: 2, borderColor: "divider" }}>
            <Typography fontWeight={900}>Location blocked</Typography>
            <Typography sx={{ opacity: 0.75, fontSize: 13, mt: 0.5 }}>
              Allow location for local weather, or use default ({defaultCity}).
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.25 }}>
              <Button variant="contained" onClick={requestLocation}>
                Try again
              </Button>
              <Button variant="outlined" onClick={useFallbackCity}>
                Use default city
              </Button>
            </Stack>
          </Paper>
        ) : status === "error" ? (
          <Paper variant="outlined" sx={{ p: 2, borderColor: "divider" }}>
            <Typography fontWeight={900}>Weather unavailable</Typography>
            <Typography sx={{ opacity: 0.75, fontSize: 13, mt: 0.5 }}>
              {err || "Please try again."}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.25 }}>
              <Button variant="outlined" onClick={requestLocation}>
                Retry location
              </Button>
              <Button variant="outlined" onClick={useFallbackCity}>
                Use default city
              </Button>
            </Stack>
          </Paper>
        ) : status !== "ready" ? (
          <Typography sx={{ opacity: 0.75 }}>Loading weather…</Typography>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography sx={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>
                {formatTemp(current.temperature_2m)}
              </Typography>
              <Typography sx={{ opacity: 0.75 }}>
                Feels {formatTemp(current.apparent_temperature)} • Wind {Math.round(current.wind_speed_10m || 0)} km/h
              </Typography>
            </Stack>

            <Typography sx={{ opacity: 0.8, fontSize: 13 }}>
              Today: {formatTemp(tMin)} – {formatTemp(tMax)}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              {hourlyChips.map((h) => (
                <Chip
                  key={h.time}
                  label={`${toLocalHour(h.time)} • ${formatTemp(h.temp)} • ${h.pop ?? 0}%`}
                  variant="outlined"
                  sx={(t) => ({
                    borderColor: "divider",
                    backgroundColor: t.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.03)
                  })}
                />
              ))}
            </Stack>
          </Stack>
        )}
      </Box>
    </Paper>
  );
}