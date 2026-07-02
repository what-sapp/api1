export default {
  path: "/api/islamic/quransearch",
  method: "GET",
  access: {
    register: true,
    limit:true,
    apikey: true,
  },
  info: [
    {
      name: "Search Ayat Al-Quran",
      status: "Ready",
      method: "GET",
      desc: "Mencari ayat berdasarkan keyword",

      params: [
        {
          name: "keyword",
          type: "text",
          required: true,
          placeholder: "contoh: pujian",
        },
        {
          name: "limit",
          type: "number",
          required: false,
          placeholder: "default: 10 (max 50)",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const keyword = url.searchParams.get("keyword");
      const limitParam = url.searchParams.get("limit");

      if (!keyword) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter keyword wajib diisi",
          })
        );
      }

      let limit = limitParam ? Number(limitParam) : 10;

      if (isNaN(limit) || limit < 1) limit = 10;
      if (limit > 50) limit = 50;

      const response = await fetch(
        "https://api.myquran.com/v3/quran/search",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword,
            limit,
          }),
        }
      );

      const result = await response.json();

      if (!result.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Gagal melakukan pencarian ayat",
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            keyword,
            total: result.data.length,
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
          status: false,
          message: e.message,
        })
      );
    }
  },
};