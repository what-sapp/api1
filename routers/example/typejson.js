export default {
  path: "/api/example/json",
  method: "POST",
  access: {
    register: false,
  },
  info: [
    {
      name: "Test JSON",
      status: "Ready",
      method: "POST",
      desc: "Input JSON mentah",
      params: [
        {
          name: "data",
          type: "json",
          placeholder: '{"name":"Ehanz","age":20}',
          required: true,
        },
      ],
    },
  ],

  execution: async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { data } = JSON.parse(body || "{}");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "JSON berhasil",
        data,
      }),
    );
  },
};
