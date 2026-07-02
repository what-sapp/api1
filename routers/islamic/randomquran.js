export default {
  path: "/api/islamic/randomquran",
  method: "GET",
  access: {
    register: true,
    limit:true,
    apikey: true,
  },
  info: [
    {
      name: "Random Ayat Al-Quran (Full Data)",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan 1 ayat random lengkap dengan seluruh data asli dari API",
    },
  ],

  execution: async (req, res) => {
    try {
      const response = await fetch(
        "https://api.myquran.com/v3/quran/random"
      );

      const result = await response.json();

      if (!result.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Gagal mengambil ayat random",
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            data: result.data,
          },
          null,
          2
        )
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: err.message,
        })
      );
    }
  },
};