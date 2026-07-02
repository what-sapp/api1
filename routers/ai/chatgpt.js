import axios from "axios";

export default {
  path: "/api/ai/chatGPT",
  method: "POST",

  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "ChatGPT",
      status: "Ready",
      method: "POST",
      desc: "Chat dengan AI cukup kirim question saja",
      params: [
        {
          name: "question",
          type: "string",
          required: true,
          placeholder: "Tulis pertanyaan kamu...",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      let body = "";
      for await (const chunk of req) body += chunk;

      const { question } = JSON.parse(body || "{}");

      if (!question) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            alasan: "Parameter question wajib diisi",
          }),
        );
      }

      const messages = [
        {
          role: "system",
          content: "You are ChatGPT, a helpful and intelligent assistant.",
        },
        {
          role: "user",
          content: question,
        },
      ];

      const response = await axios.post(
        "https://aichat-api.vercel.app/chatgpt",
        { messages },
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          timeout: 60000,
        },
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            creator: "Raihan Fadillah",
            data: {
              question,
              answer: response.data.content,
            },
          },
          null,
          2,
        ),
      );
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          alasan: e.message,
        }),
      );
    }
  },
};
