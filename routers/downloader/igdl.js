import axios from "axios";
import * as cheerio from "cheerio";

async function instagramDl(urlIg) {
  if (!urlIg) {
    throw new Error("URL Instagram wajib diisi");
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",

    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

    "Accept-Language":
      "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  };

  const homeRes = await axios.get(
    "https://insaver.io/",
    {
      headers,
    },
  );

  const cookies =
    homeRes.headers["set-cookie"]
      ?.map((c) => c.split(";")[0])
      .join("; ") || "";

  const $home = cheerio.load(homeRes.data);

  const token = $home(
    'input[name="token"]',
  ).val();

  if (!token) {
    throw new Error(
      "Gagal mendapatkan token Insaver",
    );
  }

  const payload = new URLSearchParams({
    link: urlIg,
    token,
    action: "insta",
    lang: "en",
    url_source: "/",
  });

  const postRes = await axios.post(
    "https://insaver.io/download",
    payload.toString(),
    {
      headers: {
        ...headers,

        "Content-Type":
          "application/x-www-form-urlencoded",

        Referer: "https://insaver.io/",

        Origin: "https://insaver.io",

        Cookie: cookies,
      },
    },
  );

  const $ = cheerio.load(postRes.data);

  const media = [];

  $("#result .card").each((_, el) => {
    const dlLink = $(el)
      .find(".card-footer a")
      .attr("href");

    if (!dlLink) return;

    let type = "image";

    if ($(el).find("video").length > 0) {
      type = "video";
    }

    media.push({
      type,
      url: dlLink,
    });
  });

  if (!media.length) {
    throw new Error(
      "Media tidak ditemukan",
    );
  }

  return media;
}

export default {
  path: "/api/downloader/instagram",
  method: "GET",

  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Igdl",
      status: "Ready",
      method: "GET",

      desc:
        "Download video, reels, image, carousel Instagram",

      params: [
        {
          name: "url",
          type: "string",
          required: true,

          placeholder:
            "https://www.instagram.com/reel/xxxxx/",
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

      const url =
        parsedUrl.searchParams.get("url");

      if (!url) {
        res.writeHead(400, {
          "Content-Type":
            "application/json",
        });

        return res.end(
          JSON.stringify({
            status: false,
            message:
              "Parameter url wajib diisi",
          }),
        );
      }

      const result =
        await instagramDl(url);

      res.writeHead(200, {
        "Content-Type":
          "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            result,
          },
          null,
          2,
        ),
      );
    } catch (e) {
      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      return res.end(
        JSON.stringify({
          status: false,
          message:
            e.response?.data ||
            e.message ||
            "Internal Server Error",
        }),
      );
    }
  },
};