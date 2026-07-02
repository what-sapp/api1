export default {
  path: "/api/islamic/quranjuz",
  method: "GET",
    access: {
    register: true,
    limit:true,
    apikey: true,
  },
  info: [
    {
      name: "Ayat Per Juz",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan seluruh ayat dalam satu juz (1 - 30)",

      params: [
        {
          name: "juz",
          type: "number",
          required: true,
          placeholder: "1 - 30",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const juzParam = url.searchParams.get("juz");

      if (!juzParam) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter juz wajib diisi (1 - 30)",
          })
        );
      }

      const juz = Number(juzParam);

      if (isNaN(juz) || juz < 1 || juz > 30) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter juz harus angka 1 sampai 30",
          })
        );
      }

      const response = await fetch(
        `https://api.myquran.com/v3/quran/juz/${juz}`
      );

      const result = await response.json();

      if (!result.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Gagal mengambil data juz",
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            juz,
            total_ayat: result.data.length,
            data: result.data, 
          },
          null,
          2
        )
      );
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: e.message,
        })
      );
    }
  },
};