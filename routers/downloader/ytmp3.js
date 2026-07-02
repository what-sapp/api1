import axios from "axios";

function extractVideoId(url) {
  const regex =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;

  const match = url.match(regex);
  return match ? match[1] : null;
}

async function downloadMP3(videoId) {
  const response = await axios.post(
    "https://ht.flvto.online/converter",
    {
      id: videoId,
      fileType: "mp3",
    },
    {
      headers: {
        origin: "https://ht.flvto.online",
        "content-type": "application/json",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
      },
    }
  );

  const data = response.data;

  if (data.status !== "ok") {
    throw new Error(data.msg || "Download gagal");
  }

  return {
    title: data.title,
    duration: data.duration,
    filesize: data.filesize,
    download: data.link,
  };
}

export default {
  path: "/api/downloader/ytmp3",
  method: "GET",
access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Ytmp3 file",
      status: "Ready",
      method: "GET",
      desc: "Masukkan URL YouTube, otomatis ambil ID & download MP3",

      params: [
        {
          name: "url",
          type: "text",
          required: true,
          placeholder: "Masukkan link YouTube",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      const youtubeUrl = parsedUrl.searchParams.get("url");

      if (!youtubeUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          status: false,
          message: "Parameter url wajib diisi",
        }));
      }

      const videoId = extractVideoId(youtubeUrl);

      if (!videoId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          status: false,
          message: "URL YouTube tidak valid",
        }));
      }

      const result = await downloadMP3(videoId);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: true,
        videoId,
        result,
      }, null, 2));

    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: false,
        message: e.message,
      }));
    }
  },
};