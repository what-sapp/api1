export default {
  path: "/api/example/textarea",
  method: "POST",
  access: {
    register: false,
  },
  info: [
    {
      name: "Test Textarea",
      status: "Ready",
      method: "POST",
      desc: "Textarea panjang",
      params: [
        {
          name: "text",
          type: "string",
          input: "textarea",
          placeholder: "Tulis teks panjang di sini",
          required: true,
        },
      ],
    },
  ],

  execution: async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { text } = JSON.parse(body || "{}");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "Textarea berhasil",
        length: text.length,
      }),
    );
  },
};
