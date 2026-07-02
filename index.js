import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { handleRoute, getEndpointInfo } from "./handler.js";
import { requestLogger } from "./middleware/logger.js";
import { handleMain } from "./main.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};


function send(res, code, data, type = "text/plain") {
  res.writeHead(code, {
    "Content-Type": type,
  });

  res.end(data);
}

function json(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data));
}

function serve(res, file, status = 200) {
  if (!fs.existsSync(file)) {
    file = path.join(__dirname, "views/404.html");
    status = 404;
  }

  const ext = path.extname(file);

  res.writeHead(status, {
    "Content-Type": mime[ext] || "application/octet-stream",
  });

  fs.createReadStream(file).pipe(res);
}

const pages = {
  "/": "index.html",
  "/index.html": "index.html",
  "/folder": "folder.html",
  "/run.html": "run.html",
  "/auth-success.html": "auth-success.html",
};

const assets = {
  "/css/": "views",
  "/js/": "views",
  "/lang/": "views",
  "/media/": "",
};

const server = http.createServer(async (req, res) => {
  const start = Date.now();

  res.on("finish", () => {
    requestLogger(req, res, start);
  });

  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (req.method === "GET") {
      if (pages[pathname]) {
        return serve(
          res,
          path.join(__dirname, "views", pages[pathname]),
        );
      }

      if (pathname.endsWith(".html")) {
        return serve(
          res,
          path.join(
            __dirname,
            "views",
            pathname.replace(/^\/+/, ""),
          ),
        );
      }

      for (const prefix in assets) {
        if (pathname.startsWith(prefix)) {
          return serve(
            res,
            path.join(__dirname, assets[prefix], pathname),
          );
        }
      }
    }

    const handled = await handleMain(req, res, {
      pathname,
      parsedUrl,
      __dirname,
      json,
      serveFile: serve,
      getEndpointInfo,
    });

    if (handled !== false) return;
    const dynamic = await handleRoute(req, res);
    if (dynamic) return;
    return serve(
      res,
      path.join(__dirname, "views/404.html"),
      404,
    );
  } catch (e) {
    return json(res, 500, {
      status: false,
      message: e.message,
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});