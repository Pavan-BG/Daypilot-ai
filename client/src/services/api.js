export async function apiGet(apiBase, path) {
  const r = await fetch(`${apiBase}${path}`, { credentials: "include" });
  return r.json();
}

export async function apiPost(apiBase, path, body) {
  const r = await fetch(`${apiBase}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  return r.json();
}

export async function apiPatch(apiBase, path, body) {
  const r = await fetch(`${apiBase}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  return r.json();
}

export async function apiDelete(apiBase, path) {
  const r = await fetch(`${apiBase}${path}`, { method: "DELETE", credentials: "include" });
  return r.json();
}

export async function apiPut(base, path, body) {
  const r = await fetch(`${base}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  return r.json();
}
