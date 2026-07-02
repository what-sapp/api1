import yts from "yt-search";

export default {
  path: "/api/downloader/ytsearch",
  method: "GET",
access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "YouTube Search",
      status: "Ready",
      method: "GET",
      desc: "Mencari video YouTube berdasarkan query",

      params: [
        {
          name: "query",
          type: "text",
          required: true,
          placeholder: "contoh: dj remix viral",
        },
        {
          name: "limit",
          type: "number",
          required: false,
          placeholder: "contoh: 5",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const query = urlObj.searchParams.get("query");
      const limit = parseInt(urlObj.searchParams.get("limit")) || 5;

      if (!query) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter query wajib diisi",
          })
        );
      }

      const search = await yts(query);

      if (!search.videos.length) {
        return res.end(
          JSON.stringify({
            status: false,
            message: "Video tidak ditemukan",
          })
        );
      }

      const results = search.videos.slice(0, limit).map((v, i) => ({
        no: i + 1,
        title: v.title,
        url: v.url,
        videoId: v.videoId,
        duration: v.timestamp,
        views: v.views,
        uploaded: v.ago,
        thumbnail: v.thumbnail,
        channel: {
          name: v.author.name,
          url: v.author.url,
          verified: v.author.verified,
        },
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: 'Raihan Fadillah',
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