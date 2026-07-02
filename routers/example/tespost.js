export default {
  path: "/api/example/post",
  method: "POST",
  access: {
    register: true,
  },
  info: [
    {
      name: "Test POST",
      status: "Ready",
      method: "POST",
      desc: "Contoh endpoint POST paling sederhana",
      params: [
        {
          name: "name",
          type: "string",
          placeholder: "Nama kamu",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;

    const { name = "User" } = JSON.parse(body || "{}");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "POST berhasil",
        name,
      }),
    );
  },
};
