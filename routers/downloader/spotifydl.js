import crypto from "crypto";

const BASE = "https://spotify.downloaderize.com";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";


function randomUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = crypto.randomBytes(1)[0] % 16;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


function makeConsentCookie() {
  const now = new Date().toISOString();

  const uuid = randomUUID();

  return `pressidium_cookie_consent=${encodeURIComponent(
    JSON.stringify({
      categories: ["necessary", "analytics", "targeting", "preferences"],
      level: ["necessary", "analytics", "targeting", "preferences"],
      revision: 1,
      data: null,
      rfc_cookie: false,
      consent_date: now,
      consent_uuid: uuid,
      last_consent_update: now,
    }),
  )}`;
}

function extractAjaxConfig(html) {
  const match = html.match(/var\s+spotifyDownloader\s*=\s*(\{[^;]+?\});/s);

  if (!match) throw new Error("spotifyDownloader config not found");

  let config;
  try {
    config = JSON.parse(match[1]);
  } catch {
    throw new Error("Failed parse config");
  }

  if (!config.ajaxurl || !config.nonce) {
    throw new Error("ajaxurl / nonce missing");
  }

  return {
    ajaxUrl: config.ajaxurl.replaceAll("\\/", "/"),
    nonce: config.nonce,
  };
}

async function getAjaxConfig() {
  const res = await fetch(BASE + "/", {
    method: "GET",
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      cookie: makeConsentCookie(),
    },
  });

  const html = await res.text();

  if (!res.ok) throw new Error("Failed homepage request");

  return extractAjaxConfig(html);
}

async function getSpotifyInfo(url) {
  const { ajaxUrl, nonce } = await getAjaxConfig();

  const body = new URLSearchParams({
    action: "spotify_downloader_get_info",
    url,
    nonce,
  });

  const res = await fetch(ajaxUrl, {
    method: "POST",
    headers: {
      "user-agent": UA,
      accept: "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: BASE,
      referer: BASE + "/",
      "x-requested-with": "XMLHttpRequest",
      cookie: makeConsentCookie(),
    },
    body,
  });

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!res.ok || !json.success) {
    throw new Error("Request failed");
  }

  if (json?.data?.error) {
    throw new Error(json.data.message || "Not found data");
  }

  return json;
}

function formatResponse(json) {
  const data = json.data || {};
  const media = Array.isArray(data.medias) ? data.medias[0] : null;

  return {
    status: true,
    code: 200,
    title: data.title || "",
    artist: data.author || "",
    duration: data.duration || "",
    thumbnail: data.thumbnail || "",
    url: media?.url || "",
    quality: media?.quality || "",
    extension: media?.extension || "",
    type: media?.type || "",
    raw: json,
  };
}

export default {
  path: "/api/downloader/spotifydl",
  method: "GET",

  access: {
    register: false,
  },

  info: [
    {
      name: "Spotifydl",
      status: "Ready",
      method: "GET",
      desc: "Spotify track scraper using downloaderize",

      params: [
        {
          name: "url",
          type: "string",
          placeholder: "https://open.spotify.com/track/...",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(
        req.url,
        `http://${req.headers.host}`,
      ).searchParams.get("url");

      if (!url) {
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter url wajib diisi",
          }),
        );
      }

      const json = await getSpotifyInfo(url);

      return res.end(JSON.stringify(formatResponse(json)));
    } catch (err) {
      return res.end(
        JSON.stringify({
          status: false,
          code: 500,
          message: err.message,
        }),
      );
    }
  },
};
