import axios from "axios";
import * as cheerio from "cheerio";

const API_CHALLENGE = "https://fsaver.net/api/challenge";

const API_DOWNLOAD = "https://fsaver.net/en/download";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export default {
  path: "/api/downloader/facebook",
  method: "GET",

  access: {
    register: true,
    apikey: true,
    limit: true,
  },

  info: [
    {
      name: "Fbdl",
      status: "Ready",
      method: "GET",
      desc: "Download video Facebook menggunakan Fsaver",

      params: [
        {
          name: "url",
          type: "string",
          required: true,
          placeholder: "https://facebook.com/...",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);

      const url = urlObj.searchParams.get("url");

      if (!url) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify(
            {
              status: false,
              message: "url wajib diisi",
            },
            null,
            2,
          ),
        );
      }

      const challenge = await axios.post(
        API_CHALLENGE,
        { url },
        {
          headers: {
            accept: "*/*",
            "content-type": "application/json",
            origin: "https://fsaver.net",
            "user-agent": UA,
          },
        },
      );

      const token = challenge.data?.token;

      if (!token) {
        throw new Error("Token tidak ditemukan");
      }

      const body = new URLSearchParams({
        url,
        token,
      });

      const page = await axios.post(API_DOWNLOAD, body.toString(), {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": UA,
        },
      });

      const $ = cheerio.load(page.data);

      const result = [];

      $("table tr").each((_, el) => {
        const quality = $(el).find("td").eq(0).text().trim();

        const href = $(el).find("a[download]").attr("href");

        if (!href) return;

        result.push({
          quality,
          url: href,
        });
      });

      const title =
        $(".download__item__profile_pic div")
          .first()
          .clone()
          .children()
          .remove()
          .end()
          .text()
          .trim() || null;

      const thumbnail =
        $(".download__item__profile_pic img").attr("src") || null;

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: result.length > 0,

            creator: "Raihan Fadillah",

            result: {
              title,
              thumbnail,
              media: result,
            },
          },
          null,
          2,
        ),
      );
    } catch (e) {
      console.error(e);

      res.writeHead(e.response?.status || 500, {
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
