import axios from "axios";

export default {
  path: "/api/tools/ssweb",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "ssweb",
      status: "Ready",
      method: "GET",
      desc: "Mengambil screenshot website dalam bentuk PNG",

      params: [
        {
          name: "url",
          type: "string",
          required: true,
          placeholder: "https://example.com",
        },
        {
          name: "width",
          type: "number",
          placeholder: 1280,
        },
        {
          name: "height",
          type: "number",
          placeholder: 720,
        },
        {
          name: "full_page",
          type: "boolean",
          placeholder: "true / false",
        },
        {
          name: "scale",
          type: "number",
          placeholder: 1,
        },
      ],
    },
  ],

  execution: async (req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);

    const targetUrl = urlObj.searchParams.get("url");
    const width = Number(urlObj.searchParams.get("width") || 1280);
    const height = Number(urlObj.searchParams.get("height") || 720);
    const full_page = urlObj.searchParams.get("full_page") === "true";
    const scale = Number(urlObj.searchParams.get("scale") || 1);

    if (!targetUrl) {
      return res.writeHead(400, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: false,
          message: "url wajib diisi",
        }),
      );
    }

    if (!targetUrl.startsWith("https://")) {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "URL harus https://",
        }),
      );
    }

    try {
      const { data } = await axios.post(
        "https://gcp.imagy.app/screenshot/createscreenshot",
        {
          url: targetUrl,
          browserWidth: parseInt(width),
          browserHeight: parseInt(height),
          fullPage: full_page,
          deviceScaleFactor: parseInt(scale),
          format: "png",
        },
        {
          headers: {
            "content-type": "application/json",
            referer:
              "https://imagy.app/full-page-screenshot-taker/",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/137 Mobile Safari/537.36",
          },
        },
      );

      return res.writeHead(200, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: true,
          url: data.fileUrl,
        }),
      );
    } catch (err) {
      return res.writeHead(500, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: false,
          message: err.message,
        }),
      );
    }
  },
};