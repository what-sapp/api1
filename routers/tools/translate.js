import axios from "axios";

async function translateText(text, source = "auto", target = "id") {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(
    text
  )}`;

  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = response.data;
    return data?.[0]?.map((item) => item[0]).join("") || null;
  } catch (error) {
    throw new Error(`Failed to translate text: ${error.message}`);
  }
}

export default {
  path: "/api/tools/translate",
  method: "GET",

  access: {
    register: true,
    limit: true,
    apikey:true,
  },

  info: [
    {
      name: "Translate",
      status: "Ready",
      method: "GET",
      desc: "Translate text menggunakan Google Translate API",
      params: [
        {
          name: "text",
          type: "text",
          required: true,
          placeholder: "contoh: hello world",
        },
        {
          name: "source",
          type: "text",
          required: false,
          placeholder: "contoh: en (default: auto)",
        },
        {
          name: "target",
          type: "text",
          required: false,
          placeholder: "contoh: id (default: id)",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const u = new URL(req.url, `http://${req.headers.host}`);
      const text = u.searchParams.get("text");
      const source = u.searchParams.get("source") || "auto";
      const target = u.searchParams.get("target") || "id";

      if (!text) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter text wajib diisi",
          })
        );
      }

      const translated = await translateText(text, source, target);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            user: req.user?.username || null,
            limit_left: req.user?.limit ?? null,
            data: {
              original_text: text,
              translated_text: translated,
              source_language: source,
              target_language: target,
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
          message: "Gagal menerjemahkan teks",
          error: e.message,
        })
      );
    }
  },
};