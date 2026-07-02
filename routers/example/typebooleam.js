export default {
  path: "/api/example/boolean",
  method: "GET",
  access: {
    register: false,
  },
  info: [
    {
      name: "Test Boolean",
      status: "Ready",
      method: "GET",
      desc: "Contoh parameter boolean",
      params: [
        {
          name: "active",
          type: "boolean",
          placeholder: "true / false",
          required: true,
        },
      ],
    },
  ],

  execution: (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const active = url.searchParams.get("active") === "true";

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "Boolean berhasil",
        active,
      }),
    );
  },
};
