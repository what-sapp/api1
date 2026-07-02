import https from "https";
import http from "http";

const BASE = "https://searchthatsong.com";

const UA =
  "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 VyrSTS/1.0";

function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    const lib = parsed.protocol === "https:" ? https : http;

    const payload = body ? JSON.stringify(body) : null;

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          "User-Agent": UA,
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          ...(payload
            ? {
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];

        res.on("data", (d) => chunks.push(d));

        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString();

          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: JSON.parse(raw),
            });
          } catch {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: raw,
            });
          }
        });
      },
    );

    req.on("error", reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

function getSessionId(setCookie) {
  if (!setCookie) return null;

  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

  for (const cookie of cookies) {
    const match = cookie.match(/session_id=([^;]+)/);

    if (match) {
      return match[1];
    }
  }

  return null;
}

async function routePreview(query) {
  const res = await request("POST", `${BASE}/api/search/route-preview`, {
    query,
  });

  if (res.status !== 200) {
    throw new Error(`Route preview gagal (${res.status})`);
  }

  return {
    route: res.data.route || res.data,
    sessionId: getSessionId(res.headers["set-cookie"]) || res.data.session_id,
  };
}

async function fullSearch(query, route, sessionId) {
  const res = await request(
    "POST",
    `${BASE}/`,
    {
      data: query,
      route_preview: route,
      search_mode: "web_search",
    },
    sessionId
      ? {
          Cookie: `session_id=${sessionId}`,
        }
      : {},
  );

  if (res.status !== 200) {
    throw new Error(`Search gagal (${res.status})`);
  }

  return res.data;
}

function formatResult(raw) {
  const data = raw.answer || raw;

  return {
    song: data.song || null,
    artist: data.artist || null,
    album: data.album || null,
    year: data.year_song_released || data.year || null,
    genre: data.genre || null,
    confidence: data.router_confidence || null,
    queryType: data.query_type || null,
    lyrics:
      data.plain_lyrics && data.plain_lyrics !== "n/a"
        ? data.plain_lyrics
        : null,
    relevantChunk:
      data.most_relevant_chunk && data.most_relevant_chunk !== "n/a"
        ? data.most_relevant_chunk
        : null,
    previewUrl: data.preview_audio_url || null,
    albumArtwork: data.album_artwork_url || data.album_artwork || null,
    artistPic: data.artist_profile_pic || null,
    youtubeUrl: data.Youtube_URL || data.youtube_url || null,
    webSources: data.web_sources || [],
  };
}

export default {
  path: "/api/tools/lirik",
  method: "GET",

  access: {
    register: true,
    apikey: true,
    limit: true,
  },

  info: [
    {
      name: "Search Liriks",
      status: "Ready",
      method: "GET",
      desc: "Cari lagu berdasarkan lirik",

      params: [
        {
          name: "query",
          type: "string",
          required: true,
          placeholder: "hello from the other side",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      const query = url.searchParams.get("query");

      if (!query) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify(
            {
              status: false,
              message: "query wajib diisi",
            },
            null,
            2,
          ),
        );
      }

      const route = await routePreview(query);

      const result = await fullSearch(query, route.route, route.sessionId);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",

            result: formatResult(result),
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
            message: e.message,
          },
          null,
          2,
        ),
      );
    }
  },
};
