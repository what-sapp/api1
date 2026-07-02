import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import chalk from "chalk";
import { fileURLToPath, pathToFileURL } from "url";
import { handleAccess } from "./middleware/access.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTER_DIR = path.join(__dirname, "routers");

const LOG_LEVEL = process.env.LOG_LEVEL || "minimal";

let routes = [];

function log(type, message, force = false) {
  if (LOG_LEVEL === "minimal" && !force) return;

  const time = chalk.gray(new Date().toLocaleTimeString());

  const map = {
    info: chalk.blueBright.bold("INFO "),
    load: chalk.cyanBright.bold("LOAD "),
    add: chalk.blue.bold("ADD  "),
    update: chalk.yellow.bold("EDIT "),
    remove: chalk.red.bold("DEL  "),
    error: chalk.redBright.bold("ERR  "),
    done: chalk.blueBright.bold("DONE "),
  };

  console.log(`${time} ${map[type] || type} ${chalk.white.italic(message)}`);
}

async function loadRoutes(reason = "reload") {
  routes = [];
  let count = 0;

  log("info", `Reload routes (${reason})`, true);

  const walk = async (dir) => {
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);

      if (fs.statSync(full).isDirectory()) {
        await walk(full);
        continue;
      }

      if (!file.endsWith(".js")) continue;

      try {
        const relative = path.relative(ROUTER_DIR, full);
        const folder = relative.split(path.sep)[0];

        const mod = await import(pathToFileURL(full).href + "?v=" + Date.now());

        if (mod.default?.path && mod.default?.execution) {
          routes.push({
            path: mod.default.path,
            method: (mod.default.method || "GET").toUpperCase(),
            access: mod.default.access || {},
            execution: mod.default.execution,
            info: mod.default.info || [],
            _folder: folder,
          });
          count++;
        }
      } catch (err) {
        log("error", `${file} → ${err.message}`, true);
      }
    }
  };

  await walk(ROUTER_DIR);
  log("done", `${count} routes loaded`, true);
}

await loadRoutes("startup");

let reloadTimeout = null;

chokidar.watch(ROUTER_DIR, { ignoreInitial: true }).on("all", (event, file) => {
  const name = path.relative(ROUTER_DIR, file);

  if (event === "add") log("add", name, true);
  if (event === "change") log("update", name, true);
  if (event === "unlink") log("remove", name, true);

  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => {
    loadRoutes("filesystem change");
  }, 300);
});

export async function handleRoute(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  for (const r of routes) {
    if (pathname === r.path && req.method === r.method) {
      const allowed = await handleAccess(req, res, r.access);
      if (!allowed) return true;
      await r.execution(req, res);
      return true;
    }
  }

  return false;
}

export function getEndpointInfo() {
  return routes.map((r) => ({
    folder: r._folder,
    path: r.path,
    method: r.method,
    access: r.access,
    info: r.info,
  }));
}
