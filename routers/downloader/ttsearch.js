import axios from "axios";

export default {
  path: "/api/downloader/ttsearch",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Ttsearch",
      status: "Ready",
      method: "GET",
      desc: "Cari video TikTok berdasarkan kata kunci",
      params: [
        {
          name: "q",
          type: "string",
          required: true,
          placeholder: "contoh: kucing lucu",
        },
        {
          name: "count",
          type: "number",
          required: false,
          placeholder: "Jumlah video (default 10)",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = url.searchParams.get("q");
      const count = Number(url.searchParams.get("count")) || 10;

      if (!query) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter q (query) wajib diisi",
          })
        );
      }

      const response = await axios({
        method: "POST",
        url: "https://tikwm.com/api/feed/search",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: "current_language=en",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/116 Mobile",
        },
        data: new URLSearchParams({
          keywords: query,
          count: count.toString(),
          cursor: "0",
          HD: "1",
        }).toString(),
        timeout: 30000,
      });

      const videos = response.data?.data?.videos || [];

      if (!videos.length) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
           status: false,
            message: "Tidak ada video ditemukan",
            total: 0,
            videos: [],
          })
        );
      }

      const results = videos.map((v) => ({
        id: v.video_id,
        title: v.title,
        region: v.region,
        author: v.author?.nickname,
        username: v.author?.unique_id,
        cover: v.cover,
        play: v.play,
        duration: v.duration,
        music: v.music_info?.play,
 musicTitle:v.music_info?.title,
        musicAuthor:v.music_info?.author, 
        stats: {
          views: v.play_count,
          likes: v.digg_count,
          comments: v.comment_count,
          shares: v.share_count,
          saves: v.collect_count,
        },
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            query,
            total: results.length,
            videos: results,
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
          message: "Gagal mencari video TikTok",
          error: err.response?.data || err.message,
        })
      );
    }
  },
};
