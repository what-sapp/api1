import os from "os";

let totalRequest = 0;

export function countRequest(req) {
  if (req.url.startsWith("/api/")) {
    totalRequest++;
  }
}

export function dashboardHandler(req, res, pathname) {
  if (pathname === "/api/stats") {
    const usedMem = (os.totalmem() - os.freemem()) / 1024 / 1024;
    const totalMem = os.totalmem() / 1024 / 1024;

    const data = {
      ram: `${usedMem.toFixed(0)} / ${totalMem.toFixed(0)} MB`,
      uptime: formatUptime(os.uptime()),
      cpu: os.loadavg()[0].toFixed(2),
      request: totalRequest,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
    return true;
  }
  return false;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
