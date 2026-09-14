const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createDefaultState, normalizeState, applyDailyRollover } = require("./src/trackerState");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "state.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

ensureDataFile();

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/state" && req.method === "GET") {
    return sendJson(res, 200, readState());
  }

  if (pathname === "/api/state" && req.method === "PUT") {
    return readRequestBody(req)
      .then((body) => JSON.parse(body || "{}"))
      .then((payload) => {
        const state = applyDailyRollover(normalizeState(payload));
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
        sendJson(res, 200, state);
      })
      .catch(() => sendJson(res, 400, { error: "Invalid state payload" }));
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(requestPath).replace(/^\/+/, "");
  const absolutePath = path.join(ROOT, safePath);

  if (!absolutePath.startsWith(ROOT)) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
    return sendJson(res, 404, { error: "Not found" });
  }

  const ext = path.extname(absolutePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(absolutePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`75tracker running at http://localhost:${PORT}`);
});

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(createDefaultState(), null, 2));
  }
}

function readState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return applyDailyRollover(normalizeState(parsed));
  } catch {
    return createDefaultState();
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
