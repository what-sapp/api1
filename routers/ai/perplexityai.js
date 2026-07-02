import axios from "axios";
import crypto from "crypto";

const BASE = "https://www.perplexity.ai";

const defaultHeaders = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",

  Accept: "text/event-stream",
  "Accept-Language":
    "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Content-Type": "application/json",
  Origin: BASE,
  Referer: BASE + "/",
};

function createCookie() {
  const cookies = {
    "pplx.visitor-id": crypto.randomUUID(),
    "pplx.session-id": crypto.randomUUID(),
    "pplx.edge-vid": crypto.randomUUID(),
    "pplx.edge-sid": crypto.randomUUID(),
  };

  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function createPayload(query) {
  return {
    params: {
      last_backend_uuid: crypto.randomUUID(),
      read_write_token: crypto.randomUUID(),
      attachments: [],
      language: "id-ID",
      timezone: "Asia/Jakarta",
      search_focus: "internet",
      sources: ["web"],
      frontend_uuid: crypto.randomUUID(),
      mode: "copilot",
      model_preference: "turbo",
      query_source: "followup",
      version: "2.18",
    },
    query_str: query,
  };
}

function parseSSE(raw) {
  const lines = raw.split("\n");

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    if (!line.startsWith("data: ")) {
      continue;
    }

    try {
      const data = JSON.parse(line.slice(6));

      if (!data.text || !data.final) {
        continue;
      }

      const parsed = JSON.parse(data.text);

      for (const item of parsed) {
        if (
          item.step_type === "FINAL" &&
          item.content?.answer
        ) {
          const answer = JSON.parse(
            item.content.answer
          );

          return answer.answer
            .replace(/\[\d+\]/g, "")
            .trim();
        }
      }
    } catch {}
  }

  return null;
}

async function askPerplexity(query) {
  const { data } = await axios.post(
    `${BASE}/rest/sse/perplexity_ask`,

    JSON.stringify(createPayload(query)),

    {
      headers: {
        ...defaultHeaders,
        Cookie: createCookie(),
        "x-request-id":
          crypto.randomUUID(),
      },

      timeout: 30000,
      responseType: "text",
    }
  );

  const result = parseSSE(data);

  if (!result) {
    throw new Error(
      "Gagal mendapatkan jawaban"
    );
  }

  return result;
}

export default {
  path: "/api/ai/perplexity",
  method: "POST",
  access: {
    register: false,
      apikey:true,
      limit:true,
  },

  info: [
    {
      name: "Perplexity",
      status: "Ready",
      method: "POST",
      desc: "Chat AI menggunakan Perplexity",
      params: [
        {
          name: "query",
          type: "string",
          required: true,
          placeholder:
            "Masukkan pertanyaan",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const body = [];

      req.on("data", (chunk) => {
        body.push(chunk);
      });

      req.on("end", async () => {
        try {
          const parsed = JSON.parse(
            Buffer.concat(body).toString()
          );

          const query = parsed.query;

          if (!query) {
            res.writeHead(400, {
              "Content-Type":
                "application/json",
            });

            return res.end(
              JSON.stringify(
                {
                  status: false,

                  message:
                    "Query wajib diisi",
                },
                null,
                2
              )
            );
          }

          const answer =
            await askPerplexity(query);

          res.writeHead(200, {
            "Content-Type":
              "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: true,
                creator: "Raihan Fadillah",
                result: {
                  query,
                  answer,
                },
              },
              null,
              2
            )
          );
        } catch (e) {
          res.writeHead(500, {
            "Content-Type":
              "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: false,
                message: e.message,
              },
              null,
              2
            )
          );
        }
      });
    } catch (e) {
      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: false,

            message: e.message,
          },
          null,
          2
        )
      );
    }
  },
};