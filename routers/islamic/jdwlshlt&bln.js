export default {
  path: "/api/islamic/jadwalsholatV2",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Jadwal Sholat (Harian atau Bulanan)",
      status: "Ready",
      method: "GET",
      desc: "Ambil jadwal sholat berdasarkan ID kota dan tanggal (YYYY-MM-DD atau YYYY-MM) misal 2026-02-20 atau 2026-02",

      params: [
        {
          name: "id",
          type: "text",
          required: true,
          placeholder: "ID kota dari endpoint cari-kota",
        },
        {
          name: "date",
          type: "text",
          required: false,
          placeholder: "Format: YYYY-MM-DD atau YYYY-MM (kosong = hari ini)",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      const date = url.searchParams.get("date");

      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter id wajib diisi",
          }),
        );
      }

      let endpoint;

      if (!date) {
        endpoint = `https://api.myquran.com/v3/sholat/jadwal/${id}/today`;
      } else {
        endpoint = `https://api.myquran.com/v3/sholat/jadwal/${id}/${date}`;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (!result.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Data tidak ditemukan atau format tanggal salah",
          }),
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            lokasi: {
              kota: result.data.kabko,
              provinsi: result.data.prov,
            },
            jadwal: result.data.jadwal,
            type: date ? (date.length === 7 ? "monthly" : "daily") : "today",
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
