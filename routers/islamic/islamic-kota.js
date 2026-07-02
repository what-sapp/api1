export default {
  path: "/api/islamic/kabupaten",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Daftar Kab List ID",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan seluruh ID dan nama kabupaten/kota Indonesia untuk jadwal sholat",
    },
  ],

  execution: async (req, res) => {
    try {
      const response = await fetch(
        "https://api.myquran.com/v3/sholat/kabkota/semua",
      );

      const result = await response.json();

      if (!result.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Gagal mengambil data kota",
          }),
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            total: result.data.length,
            data: result.data,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: err.message,
        }),
      );
    }
  },
};
