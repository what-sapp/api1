import axios from "axios";

async function quickSearch(query) {
  const url =
    "https://www.pinterest.com/resource/BaseSearchResource/get/?data=" +
    encodeURIComponent(
      JSON.stringify({
        options: { query },
      })
    );

  const res = await axios.head(url, {
    headers: {
      "screen-dpr": "4",
      "x-pinterest-pws-handler": "www/search/[scope].js",
      "user-agent": "Mozilla/5.0",
    },
    timeout: 15000,
    validateStatus: () => true,
  });

  const linkHeader = res.headers["link"] || "";
  const links = [
    ...linkHeader.matchAll(/<(https:\/\/i\.pinimg\.com\/[^>]+)>/g),
  ].map((m) => m[1]);

  return links;
}

export default {
  path: "/api/downloader/pinsearch",
  method: "GET",
access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Pinsearch",
      status: "Ready",
      method: "GET",
      desc: "Mencari gambar dari Pinterest berdasarkan query",
      params: [
        {
          name: "query",
          type: "text",
          required: true,
          placeholder: "contoh: kucing lucu",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = url.searchParams.get("query");

      if (!query) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "param query wajib diisi",
          })
        );
      }

      const results = await quickSearch(query);

      if (!results.length) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Tidak ada hasil ditemukan",
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            query,
            total: results.length,
            results,
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