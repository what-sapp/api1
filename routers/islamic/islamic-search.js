export default {
  path: "/api/islamic/carikota",
  method: "GET",
  access: {
    register: true,
    limit:true,
    apikey: true,
  },
  info: [
    {
      name: "Cari Kab/Kota Jadwal Sholat",
      status: "Ready",
      method: "GET",
      desc: "Mencari ID kabupaten/kota berdasarkan nama",

      params: [
        {
          name: "search",
          type: "text",
          required: true,
          placeholder: "contoh: kediri",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const search = url.searchParams.get("search");

      if (!search) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter search wajib diisi",
          })
        );
      }

      const apiUrl = `https://api.myquran.com/v3/sholat/kabkota/cari/${encodeURIComponent(
        search
      )}`;

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!result.status) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Kota tidak ditemukan",
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            total: result.data.length,
            results: result.data,
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