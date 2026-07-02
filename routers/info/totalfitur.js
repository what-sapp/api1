export default {
  path: "/api/info/totalfitur",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Total Fitur",
      status: "Ready",
      method: "GET",
      desc: "Total semua endpoint API",
    },
  ],

  execution: async (req, res) => {
    if (!req.user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ status: false, message: "Unauthorized" }),
      );
    }

    const response = await fetch(`http://${req.headers.host}/api/endpoints`);
    const endpoints = await response.json();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        data: {
          total: Array.isArray(endpoints) ? endpoints.length : 0,
        },
      }),
    );
  },
};
