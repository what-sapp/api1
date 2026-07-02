export default {
  path: "/api/info/cekapikey",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Check APIKEY",
      status: "Ready",
      method: "GET",
      desc: "Cek limit dan status premium dari API key yang dipakai",
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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        data: {
          premium: Boolean(user.premium),
          limit: user.limit,
        },
      }),
    );
  },
};
