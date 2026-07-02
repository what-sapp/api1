import formidable from "formidable";
import { text2img } from "../../lib/scrape/text2img.js";

export default {
  path: "/api/ai/text2img",
  method: "GET",

  access: {
    register: false,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Text To Image",
      status: "Ready",
      method: "GET",
      desc: "Generate gambar AI dari text prompt",

      params: [
        {
          name: "prompt",
          type: "string",
          required: true,
          placeholder: "Contoh: mobil futuristik logo RHNX",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      const prompt = url.searchParams.get("prompt");

      if (!prompt) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify(
            {
              status: false,
              message: "Parameter prompt wajib diisi",
            },
            null,
            2,
          ),
        );
      }

      const result = await text2img(prompt);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: result.status,
            creator: "Raihan Fadillah",
            result,
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
