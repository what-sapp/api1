import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";

function extractVideoId(url) {
  const regex =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;

  const match = url.match(regex);

  return match ? match[1] : null;
}

function findWorkerUrl(obj, isAudio = true) {
  if (typeof obj === "string") {
    if (isAudio && obj.includes("/v5/audio/")) {
      return obj;
    }

    if (!isAudio && obj.includes("/v5/video/")) {
      return obj;
    }
  }

  if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      const result = findWorkerUrl(obj[key], isAudio);

      if (result) return result;
    }
  }

  return null;
}

function findDownloadUrl(obj) {
  if (typeof obj === "string") {
    if (
      obj.includes("iamworker.com") ||
      obj.includes("googlevideo.com")
    ) {
      return obj;
    }
  }

  if (typeof obj === "object" && obj !== null) {
    if (obj.url?.startsWith("http")) {
      return obj.url;
    }

    if (obj.downloadUrl?.startsWith("http")) {
      return obj.downloadUrl;
    }

    if (obj.file?.startsWith("http")) {
      return obj.file;
    }

    for (const key in obj) {
      const result = findDownloadUrl(obj[key]);

      if (result) return result;
    }
  }

  return null;
}

async function createDownload(youtubeUrl, isAudio = true) {
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    throw new Error("URL YouTube tidak valid");
  }

  const headers = {
    "Content-Type":
      "application/x-www-form-urlencoded; charset=UTF-8",

    Accept: "*/*",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": USER_AGENT,
    Referer: "https://app.ytdown.to/en27/",
  };

  let initRes = await axios.post(
    "https://app.ytdown.to/proxy.php",
    new URLSearchParams({
      url: `https://youtu.be/${videoId}`,
    }).toString(),

    {
      headers,
      timeout: 15000,
    },
  );

  let data = initRes.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {}
  }

  const title = data.title || "YouTube Media";

  const thumbnail =
    data.thumbnail ||
    data.thumb ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const workerUrl = findWorkerUrl(data, isAudio);

  if (!workerUrl) {
    throw new Error(
      isAudio
        ? "Worker audio tidak ditemukan"
        : "Worker video tidak ditemukan",
    );
  }

  let finalUrl = "";

  for (let i = 0; i < 8; i++) {
    await new Promise((resolve) =>
      setTimeout(resolve, 3000),
    );

    let pollRes = await axios.post(
      "https://app.ytdown.to/proxy.php",

      new URLSearchParams({
        url: workerUrl,
      }).toString(),

      {
        headers,
        timeout: 15000,
      },
    );

    let pollData = pollRes.data;

    if (typeof pollData === "string") {
      try {
        pollData = JSON.parse(pollData);
      } catch {}
    }

    finalUrl = findDownloadUrl(pollData);

    if (finalUrl && finalUrl !== workerUrl) {
      break;
    }
  }

  if (!finalUrl) {
    throw new Error("Timeout download");
  }

  return {
    title,
    thumbnail,
    videoId,
    url: finalUrl,
  };
}

export default {
  path: "/api/downloader/ytdl",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Ytdl",
      status: "Ready",
      method: "GET",
      desc: "Download MP3 dan MP4 dari YouTube",

      params: [
        {
          name: "url",
          type: "string",
          required: true,
          placeholder:
            "https://youtube.com/watch?v=xxxx",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const parsedUrl = new URL(
        req.url,
        `http://${req.headers.host}`,
      );

      const url = parsedUrl.searchParams.get("url");

      if (!url) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter url wajib diisi",
          }),
        );
      }

      const [audio, video] = await Promise.all([
        createDownload(url, true),
        createDownload(url, false),
      ]);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",

            result: {
              title: audio.title,
              thumbnail: audio.thumbnail,
              videoId: audio.videoId,

              audio: {
                type: "mp3",
                download: audio.url,
              },

              video: {
                type: "mp4",
                download: video.url,
              },
            },
          },
          null,
          2,
        ),
      );
    } catch (e) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify({
          status: false,
          message: e.message,
        }),
      );
    }
  },
};