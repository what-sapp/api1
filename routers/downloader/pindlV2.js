import axios from "axios";

async function downloadPin(url) {
  const res = await axios.post(
    "https://downloadpin.co/api/download",
    { url },
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://downloadpin.co",
        Referer: "https://downloadpin.co/",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      },
      timeout: 15000,
    }
  );

  const json = res.data;

  if (!json.success || !json.data) {
    throw new Error(json.message || "Download gagal");
  }

  return {
    type: json.data.mediaType,
    media: json.data.mediaUrl || json.data.cleanedUrl,
    title: json.data.title || "Pinterest Media",
    description: json.data.description || "",
    original: json.data.originalUrl || url,
  };
}

export default {
  path: "/api/downloader/pindlV2",
  method: "GET",

  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Pindl V2",
      status: "Ready",
      method: "GET",
      desc: "Download video atau gambar dari Pinterest via downloadpin.co",
      params: [
        {
          name: "url",
          type: "text",
          required: true,
          placeholder: "https://pin.it/xxxxx",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const u = new URL(req.url, `http://${req.headers.host}`);
      const url = u.searchParams.get("url");

      if (!url) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter url wajib diisi",
          })
        );
      }

      const result = await downloadPin(url);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            data: {
              type: result.type,
              title: result.title,
              description: result.description,
              media: result.media,
              original_url: result.original,
            },
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
          message: "Gagal mengambil media Pinterest",
          error: e.message,
        })
      );
    }
  },
};