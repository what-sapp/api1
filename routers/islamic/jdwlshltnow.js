export default {
  path: "/api/islamic/jadwalsholat",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Jadwal Sholat Hari Ini",
      status: "Ready",
      method: "GET",
      desc: "Ambil jadwal sholat hari ini berdasarkan ID kota",

      params: [
        {
          name: "id",
          type: "text",
          required: true,
          placeholder: "Masukkan ID kota dari /islamic/carikota",
        },
        {
          name: "time-zone",
          type: "select",
          required: false,
          options: ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"],
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      const tz = url.searchParams.get("tz") || "Asia/Jakarta";

      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter id wajib diisi",
          }),
        );
      }

      const apiUrl = `https://api.myquran.com/v3/sholat/jadwal/${id}/today?tz=${encodeURIComponent(
        tz,
      )}`;

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!result.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "ID tidak valid atau data tidak ditemukan",
          }),
        );
      }

      const jadwalKey = Object.keys(result.data.jadwal)[0];
      const jadwal = result.data.jadwal[jadwalKey];

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            timezone: tz,
            lokasi: {
              kota: result.data.kabko,
              provinsi: result.data.prov,
            },
            jadwal,
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
