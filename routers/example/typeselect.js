export default {
  path: "/api/example/select",
  method: "GET",
  access: {
    register: false,
  },
  info: [
    {
      name: "Test Select",
      status: "Ready",
      method: "GET",
      desc: "Chat AI dengan pilihan model",
      params: [
        {
          name: "text",
          type: "text",
          required: true,
          placeholder: "Tulis pesan",
        },
        {
          name: "model",
          type: "select",
          required: true,
          placeholder: "Pilih model AI",
          options: ["doctor", "guru", "petani", "dukun"],
        },
      ],
    },
  ],

  execution: (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const text = url.searchParams.get("text");
    const model = url.searchParams.get("model");

    if (!text || !model) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Parameter text dan model wajib diisi",
        }),
      );
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "GET berhasil",
        input: {
          text,
          model,
        },
      }),
    );
  },
};
