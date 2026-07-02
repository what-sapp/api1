import axios from "axios";
import * as cheerio from "cheerio";
import moment from "moment-timezone";

async function detikSearch(query) {
  try {
    const url = `https://www.detik.com/search/searchall?query=${encodeURIComponent(query)}`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    const results = [];

    $(".list-content__item").each((i, el) => {
      const title = $(el).find("h3 a").text().trim();
      const link = $(el).find("h3 a").attr("href");
      const thumbnail =
        $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

      if (title && link) {
        results.push({
          source: "Detikcom",
          title,
          link,
          thumbnail,
        });
      }
    });

    return results.slice(0, 5);
  } catch (err) {
    console.log("ERROR DETIK:", err.message);
    return [];
  }
}

export default {
  path: "/api/ai/rynexchat",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const text = url.searchParams.get("text");
      const userPrompt = url.searchParams.get("prompt") || "";

      if (!text) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter text wajib diisi",
          })
        );
      }

      const now = moment()
        .tz("Asia/Jakarta")
        .format("dddd, DD MMMM YYYY HH:mm:ss");

      const lower = text.toLowerCase();

      if (
        lower.includes("presiden indonesia") ||
        lower.includes("siapa presiden") ||
        lower.includes("presiden sekarang")
      ) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: true,
            creator: "Raihan Fadillah",
            time: now,
            data: {
              query: text,
              result:
                "Presiden Indonesia saat ini adalah Prabowo Subianto (periode 2024-2029). Wakil Presiden adalah Gibran Rakabuming Raka.",
            },
          }, null, 2)
        );
      }

      const news = await detikSearch(text);

      let newsText = "";
      if (news.length > 0) {
        newsText = `
Berikut berita terbaru dari Detik:
${news
  .map(
    (n, i) =>
      `${i + 1}. ${n.title}
Sumber: ${n.source}
Link: ${n.link}`
  )
  .join("\n\n")}
`;
      }

      const systemPrompt = `
Kamu adalah RynexChat, AI assistant yang ramah, cepat, dan pintar.
Nama kamu selalu RynexChat.
Jika ditanya siapa kamu, jawab: "Saya RynexChat AI yang di kembangkan oleh RHNX".

Waktu sekarang: ${now}
Timezone: Asia/Jakarta

Informasi penting:
Presiden Indonesia saat ini adalah Prabowo Subianto (2024-2029).
Wakil Presiden adalah Gibran Rakabuming Raka.

Gunakan info realtime jika diperlukan.
Jika ada berita terbaru gunakan sebagai referensi dan sebutkan sumbernya.

${newsText}

${userPrompt ? `Instruksi tambahan dari user: ${userPrompt}` : ""}
`;

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ];

      const result = await axios.post(
        "https://aichat-api.vercel.app/chatgpt",
        { messages }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            time: now,
            data: {
              query: text,
              prompt: userPrompt,
              news,
              result: result.data.content,
            },
          },
          null,
          2
        )
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: "Gagal memproses AI",
          error: err.response?.data || err.message,
        })
      );
    }
  },
};