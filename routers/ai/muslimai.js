import axios from "axios";

export default {
  path: "/api/ai/muslimai",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Muslim",
      status: "Ready",
      method: "GET",
      desc: "AI tanya jawab Islami",

      params: [
        {
          name: "text",
          type: "string",
          input: "textarea",
          required: true,
          placeholder: "Tulis pertanyaan islami",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const text = url.searchParams.get("text");
      

      if (!text || !text.trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          status: false,
          message: "Parameter text wajib diisi",
        }));
      }

      // STEP 1: SEARCH
      const search = await axios.post(
        "https://www.muslimai.io/api/search",
        { query: text },
        { headers: { "Content-Type": "application/json" } }
      );

      const passages = Array.isArray(search.data)
        ? search.data.map(i => i.content).join("\n\n")
        : "";

      // STEP 2: ANSWER
      const answer = await axios.post(
        "https://www.muslimai.io/api/answer",
        {
          prompt: `
Jawab pertanyaan berikut berdasarkan Al-Qur'an dan Islam.
Jangan sebutkan sumber passages.

Pertanyaan:
${text}

Referensi:
${passages}
`,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: true,
        creator: "Raihan Fadillah",
        data: {
          query: text,
          result: answer.data,
        },
      }, null, 2));

    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: false,
        message: "Gagal memproses Muslim AI",
        error: err.response?.data || err.message,
      }));
    }
  },
};