export default {
  path: "/api/games/tekateki",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Teka Teki",
      status: "Ready",
      method: "GET",
      desc: "Ambil soal random game Teka Teki",
    },
  ],

  execution: async (req, res) => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/rhnxofficial/database/master/games/tekateki.json",
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
