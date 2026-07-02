export default {
  path: "/api/games/susunkata",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Susun Kata",
      status: "Ready",
      method: "GET",
      desc: "Ambil soal random game Susun Kata",
    },
  ],

  execution: async (req, res) => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/rhnxofficial/database/main/games/susunkata.json",
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
