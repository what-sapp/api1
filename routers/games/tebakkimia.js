export default {
  path: "/api/games/tebakkimia",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Tebak Kimia",
      status: "Ready",
      method: "GET",
      desc: "Ambil soal random game Tebak Kimia",
    },
  ],

  execution: async (req, res) => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkimia.json",
      );

      const data = await response.json();
      const result = data[Math.floor(Math.random() * data.length)];

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            result,
            total: data.length,
          },
          null,
          2,
        ),
      );
    } catch (e) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify(
          {
            status: false,
            message: e.message,
          },
          null,
          2,
        ),
      );
    }
  },
};
