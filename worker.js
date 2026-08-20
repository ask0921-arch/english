/**
 * Tiny English Tree — Worker script.
 *
 * Handles a few /api/* routes for family voice recordings (backed by an R2 bucket),
 * and falls through to the static site (env.ASSETS) for everything else.
 *
 * Bindings expected (see wrangler.jsonc):
 *   - env.ASSETS       — the static site (from the "assets" config)
 *   - env.RECORDINGS   — R2 bucket binding for storing recording audio blobs
 *   - env.FAMILY_PASSCODE — a secret string; required (via the X-Passcode header) for
 *                            any write (PUT/DELETE) or the /api/export backup download.
 *                            Set it once with: npx wrangler secret put FAMILY_PASSCODE
 */

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB is generous for a few seconds of speech

function checkPasscode(request, env) {
  const supplied = request.headers.get("X-Passcode") || "";
  return !!env.FAMILY_PASSCODE && supplied === env.FAMILY_PASSCODE;
}

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init && init.headers) },
  });
}

async function handleRecGet(env, key) {
  const obj = await env.RECORDINGS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": (obj.httpMetadata && obj.httpMetadata.contentType) || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function handleRecPut(request, env, key) {
  if (!checkPasscode(request, env)) return new Response("Unauthorized", { status: 401 });
  if (!key || key.length > 128) return new Response("Bad key", { status: 400 });
  const contentType = request.headers.get("Content-Type") || "application/octet-stream";
  const body = await request.arrayBuffer();
  if (body.byteLength === 0) return new Response("Empty body", { status: 400 });
  if (body.byteLength > MAX_UPLOAD_BYTES) return new Response("Too large", { status: 413 });
  await env.RECORDINGS.put(key, body, { httpMetadata: { contentType } });
  return new Response("OK");
}

async function handleRecDelete(request, env, key) {
  if (!checkPasscode(request, env)) return new Response("Unauthorized", { status: 401 });
  await env.RECORDINGS.delete(key);
  return new Response("OK");
}

async function handleRecList(env) {
  const keys = [];
  let cursor;
  do {
    const listed = await env.RECORDINGS.list({ cursor, limit: 1000 });
    for (const obj of listed.objects) keys.push(obj.key);
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return json({ keys }, { headers: { "Cache-Control": "no-store" } });
}

async function handleExport(request, env) {
  if (!checkPasscode(request, env)) return new Response("Unauthorized", { status: 401 });
  const recordings = [];
  let cursor;
  do {
    const listed = await env.RECORDINGS.list({ cursor, limit: 1000 });
    for (const entry of listed.objects) {
      const obj = await env.RECORDINGS.get(entry.key);
      if (!obj) continue;
      const buf = await obj.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      recordings.push({
        key: entry.key,
        contentType: (obj.httpMetadata && obj.httpMetadata.contentType) || "application/octet-stream",
        base64: btoa(binary),
      });
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return json({ exportedAt: new Date().toISOString(), recordings });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/rec/")) {
      const key = decodeURIComponent(path.slice("/api/rec/".length));
      if (request.method === "GET") return handleRecGet(env, key);
      if (request.method === "PUT") return handleRecPut(request, env, key);
      if (request.method === "DELETE") return handleRecDelete(request, env, key);
      return new Response("Method not allowed", { status: 405 });
    }

    if (path === "/api/rec-list" && request.method === "GET") {
      return handleRecList(env);
    }

    if (path === "/api/export" && request.method === "GET") {
      return handleExport(request, env);
    }

    // Everything else: serve the static site (index.html, manifest.json, sw.js, icons/, ...)
    return env.ASSETS.fetch(request);
  },
};
