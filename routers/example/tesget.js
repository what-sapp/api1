export default {
  path: "/api/example/get",
  method: "GET",
  access: {
    register: false,
  },
  info: [
    {
      name: "Test GET",
      status: "Ready",
      method: "GET",
      desc: "Contoh endpoint GET paling sederhana",
      params: [
        {
          name: "name",
          type: "string",
          placeholder: "Nama kamu",
        },
      ],
    },
  ],

  execution: (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const name = url.searchParams.get("name") || "User";

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "GET berhasil",
        name,
      })
    );
  },
};
