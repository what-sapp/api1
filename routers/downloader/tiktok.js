import axios from "axios";

export default {
  path: "/api/downloader/tiktok",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Tiktokdl",
      status: "Ready",
      method: "GET",
      desc: "Download video / slide TikTok tanpa watermark",
      params: [
        {
          name: "url",
          type: "string",
          required: true,
          placeholder: "https://www.tiktok.com/...",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const q = new URL(req.url, `http://${req.headers.host}`);
      const tiktokUrl = q.searchParams.get("url");

      if (!tiktokUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter url wajib diisi",
          })
        );
      }

      const response = await axios({
        method: "POST",
        url: "https://tikwm.com/api/",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: "current_language=en",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/116 Mobile",
        },
        data: new URLSearchParams({ url: tiktokUrl }).toString(),
        timeout: 30000,
      });

      const data = response.data?.data;
      if (!data) {
        throw new Error("Data TikTok kosong");
      }

      let type = "unknown";
      if (Array.isArray(data.images) && data.images.length > 0) {
        type = "image";
      } else if (data.play) {
        type = "video";
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            data: {
              id: data.video_id,
              type,
              title: data.title,
              author: data.author?.nickname,
              username: data.author?.unique_id,
              region: data.region,
              duration: data.duration,
              cover: data.cover,
              video: data.play,
              no_watermark: data.play,
              watermark: data.wmplay,
              music: data.music_info?.play,
              musicTitle:data.music_info?.title,
        musicAuthor:data.music_info?.author, 
              images: data.images || [],
              stats: {
                views: data.play_count,
                likes: data.digg_count,
                comments: data.comment_count,
                shares: data.share_count,
                saves: data.collect_count,
              },
            },
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
          message: "Gagal mengambil data TikTok",
          error: err.response?.data || err.message,
        })
      );
    }
  },
};
