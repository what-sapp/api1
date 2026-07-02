export default {
  path: "/api/example/number",
  method: "GET",
  access: {
    register: false,
  },
  info: [
    {
      name: "Test Number",
      status: "Ready",
      method: "GET",
      desc: "Contoh parameter number",
      params: [
        {
          name: "a",
          type: "number",
          placeholder: "Angka pertama",
          required: true,
        },
        {
          name: "b",
          type: "number",
          placeholder: "Angka kedua",
          required: true,
        },
      ],
    },
  ],

  execution: (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const a = Number(url.searchParams.get("a"));
    const b = Number(url.searchParams.get("b"));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "Number berhasil",
        result: a + b,
      }),
    );
  },
};
