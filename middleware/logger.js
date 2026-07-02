import chalk from "chalk";
import moment from "moment-timezone";

function cKey(key) {
  return chalk.cyanBright.bold(key);
}

function cVal(val, color = "white") {
  return chalk[color]?.italic?.(String(val)) || String(val);
}

function getIP(req) {
  let ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "Unknown";

  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip;
}

function getDevice(req) {
  const ua = req.headers["user-agent"] || "";
  if (/mobile/i.test(ua)) return "Mobile";
  if (/tablet/i.test(ua)) return "Tablet";

  return "Desktop";
}

function getBrowser(req) {
  const ua = req.headers["user-agent"] || "";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";

  return "Unknown";
}

function getOS(req) {
  const ua = req.headers["user-agent"] || "";

  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("Mac")) return "MacOS";
  if (ua.includes("Linux")) return "Linux";

  return "Unknown";
}

function getAction(pathname) {

  if (pathname.includes("/api/login")) {
    return "Login";
  }
  if (pathname.includes("/api/register")) {
    return "Register";
  }
  if (pathname.includes("/api/user")) {
    return "Get Profile";
  }
  if (pathname.includes("/api/update-profile")) {
    return "Update Profile";
  }
  if (pathname.includes("/api/changelog")) {
    return "Open Changelog";
  }
  if (pathname.includes("/api/folders")) {
    return "Open Folder List";
  }
  if (pathname.includes("/api/endpoints")) {
    return "Open Endpoint List";
  }

  return "Access API";
}

export function requestLogger(req, res, start) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  const pathname = url.pathname;

  const ignored = [
    ".css",
    ".map",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".js",
  ];

  if (ignored.some((ext) => pathname.endsWith(ext))) {
    return;
  }

  const duration = `${Date.now() - start}ms`;

  const statusColor =
    res.statusCode >= 500
      ? "redBright"
      : res.statusCode >= 400
        ? "yellowBright"
        : "greenBright";

  const action = getAction(pathname);

  const data = {
    type: pathname.startsWith("/api/") ? "API" : "PAGE",
    action,
    method: req.method,
    path: pathname,
    query: url.search || "-",
    sender: req.user?.username || "guest",
    senderId: req.user?.id || "-",
    role: req.user?.role || "guest",
    ip: getIP(req),
    browser: getBrowser(req),
    os: getOS(req),
    device: getDevice(req),
    referer: req.headers.referer || "-",
    status: res.statusCode,
    duration,
    time: moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
  };

  console.log(
    "\n" +
      chalk.gray("╭───────────────────────────────") +
      "\n" +
      chalk.cyanBright.bold("  RHNX REQUEST LOGGER") +
      "\n" +
      chalk.gray("├───────────────────────────────") +
      "\n" +
      Object.entries(data)
        .map(([k, v]) => {
          let color = "white";

          if (k === "status") color = statusColor;
          if (k === "sender") color = "magentaBright";
          if (k === "action") color = "blueBright";
          if (k === "ip") color = "yellowBright";

          return ` ${cKey(k.padEnd(10))} : ${cVal(v, color)}`;
        })
        .join("\n") +
      "\n" +
      chalk.gray("╰───────────────────────────────") +
      "\n",
  );
}
