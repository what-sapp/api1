import yt from "yt-search";

const BASE = "https://app.ytdown.to";
const API = `${BASE}/proxy.php`;
const PAGE = `${BASE}/en27/`;

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

const MAX_POLL = 120;
const POLL_DELAY = 2500;

let cookieJar = "";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSetCookie(headers) {
  const setCookie = headers.get("set-cookie");

  if (!setCookie) return "";

  return setCookie
    .split(/,(?=\s*[^;,]+=)/g)
    .map((v) => v.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function randomGa() {
  const a = Math.floor(Math.random() * 1e10);

  const b = Math.floor(Date.now() / 1000);

  return `GA1.1.${a}.${b}`;
}

function buildCookie(extra = "") {
  const now = Math.floor(Date.now() / 1000);

  const ga = `_ga=${randomGa()}`;

  const ga2 = `_ga_2K69M9RN1B=GS2.1.s${now}$o1$g1$t${now}$j49$l0$h0`;

  return [cookieJar, ga, ga2, extra].filter(Boolean).join("; ");
}

async function warmup() {
  const res = await fetch(PAGE, {
    method: "GET",

    headers: {
      "user-agent": UA,

      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const cookie = parseSetCookie(res.headers);

  if (cookie) {
    cookieJar = cookie;
  }

  await res.text().catch(() => {});
}

async function searchVideo(query) {
  const search = await yt.search(query);

  const video =
    search?.videos?.[0] ||
    search?.results?.find((v) => v.type === "video") ||
    search?.results?.[0];

  if (!video) {
    throw new Error("Video tidak ditemukan");
  }

  if (!video.url) {
    throw new Error("URL video tidak ditemukan");
  }

  return video;
}

async function requestDownload(videoUrl) {
  const body = new URLSearchParams({
    url: videoUrl,
  });

  const res = await fetch(API, {
    method: "POST",

    headers: {
      "user-agent": UA,

      accept: "*/*",

      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",

      origin: BASE,

      referer: PAGE,

      "x-requested-with": "XMLHttpRequest",

      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,

      "sec-ch-ua-mobile": "?1",

      "sec-ch-ua-platform": `"Android"`,

      "sec-fetch-site": "same-origin",

      "sec-fetch-mode": "cors",

      "sec-fetch-dest": "empty",

      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

      cookie: buildCookie(),

      priority: "u=1, i",
    },

    body,
  });

  const text = await res.text();

  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Response bukan JSON: ${text.slice(0, 500)}`);
  }

  if (!res.ok) {
    throw new Error(
      `Download gagal HTTP ${res.status}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

function pickMp3(downloadJson) {
  const items = downloadJson?.api?.mediaItems || [];

  const mp3 =
    items.find((x) => x.type === "Audio" && x.mediaExtension === "MP3") ||
    items.find((x) => x.type === "Audio" && x.mediaQuality === "128K") ||
    items.find((x) => x.type === "Audio");

  if (!mp3) return null;

  return {
    quality: mp3.mediaQuality,
    extension: mp3.mediaExtension,
    size: mp3.mediaFileSize,
    duration: mp3.mediaDuration,
    url: mp3.mediaUrl,
  };
}

function isFinalUrl(value) {
  return (
    typeof value === "string" &&
    value.startsWith("http") &&
    value !== "Waiting..." &&
    value !== "In Processing..."
  );
}

async function resolveAudioUrl(mediaUrl) {
  let lastJson = null;

  for (let i = 1; i <= MAX_POLL; i++) {
    const res = await fetch(mediaUrl, {
      method: "GET",

      headers: {
        "user-agent": UA,

        accept: "application/json, text/plain, */*",

        referer: PAGE,
      },
    });

    const text = await res.text();

    let json;

    try {
      json = JSON.parse(text);
    } catch {
      if (mediaUrl.startsWith("http")) {
        return mediaUrl;
      }

      throw new Error(`Response polling bukan JSON: ${text.slice(0, 500)}`);
    }

    lastJson = json;

    const fileUrl = json?.fileUrl || json?.url || json?.downloadUrl;

    if (isFinalUrl(fileUrl)) {
      return fileUrl;
    }

    if (json?.status === "done" && isFinalUrl(fileUrl)) {
      return fileUrl;
    }

    if (json?.status === "error" || json?.status === "failed") {
      throw new Error(`Render audio gagal: ${JSON.stringify(json)}`);
    }

    await sleep(POLL_DELAY);
  }

  throw new Error(`Audio belum selesai diproses: ${JSON.stringify(lastJson)}`);
}

export default {
  path: "/api/downloader/play",

  method: "GET",

  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Play Music",
      status: "Ready",
      method: "GET",

      desc: "Search lagu dan download mp3",

      params: [
        {
          name: "query",
          type: "string",
          required: true,
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

      const query = parsedUrl.searchParams.get("query");

      if (!query) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify(
            {
              status: false,
              message: "Query wajib diisi",
            },
            null,
            2,
          ),
        );
      }

      const video = await searchVideo(query);

      await warmup();

      const download = await requestDownload(video.url);

      const audio = pickMp3(download);

      if (!audio?.url) {
        throw new Error("URL audio tidak ditemukan");
      }

      audio.url = await resolveAudioUrl(audio.url);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            result: {
              query,
              title: video.title,
              videoId: video.videoId,
              url: video.url,
              thumbnail: video.thumbnail,
              description: video.description,
              seconds: video.seconds,
              timestamp: video.timestamp,
              duration: video.duration,
              views: video.views,
              ago: video.ago || null,
              author: video.author,
              audio,
            },
          },
          null,
          2,
        ),
      );
    } catch (e) {
      console.error(e);

      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: false,
            message: String(e?.message || e),
          },
          null,
          2,
        ),
      );
    }
  },
};
