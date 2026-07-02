import os from "os";

export default {
  path: "/api/info/dashboard",
  method: "GET",

  access: {
    register: true,
    apikey: true,
    owner: true,
  },

  info: [
    {
      name: "Dashboard System",
      status: "Ready",
      method: "GET",
      desc: "Monitoring server (RAM, CPU, Uptime, Request)",
    },
  ],

  execution: async (req, res) => {
    const user = req.user;

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Unauthorized",
        }),
      );
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = ((usedMem / totalMem) * 100).toFixed(1);
    const cpuLoad = os.loadavg()[0].toFixed(2);
    const uptimeSec = os.uptime();
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        data: {
          ram: `${ramPercent}%`,
          cpu: cpuLoad,
          uptime: `${hours}h ${minutes}m`,
        },
      }),
    );
  },
};
