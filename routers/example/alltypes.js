export default {
  path: "/api/example/all-types",
  method: "GET",

  access: {
    register: false,
  },

  info: [
    {
      name: "Test All Param Types",
      status: "Ready",
      method: "GET",
      desc: "Endpoint untuk testing semua tipe parameter di playground",

      params: [
        {
          name: "text",
          type: "string",
          placeholder: "Text biasa",
        },
        {
          name: "age",
          type: "number",
          placeholder: "Umur",
        },
        {
          name: "active",
          type: "boolean",
        },
        {
          name: "role",
          type: "select",
          options: [
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
            { label: "Guest", value: "guest" },
          ],
        },
        {
          name: "bio",
          input: "textarea",
          placeholder: "Deskripsi panjang",
        },
        {
          name: "config",
          type: "json",
          placeholder: '{"dark": true}',
        },
      ],
    },
  ],

  execution: (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const result = {
      text: url.searchParams.get("text"),
      age: Number(url.searchParams.get("age")),
      active: url.searchParams.get("active") === "true",
      role: url.searchParams.get("role"),
      bio: url.searchParams.get("bio"),
      config: (() => {
        try {
          return JSON.parse(url.searchParams.get("config"));
        } catch {
          return null;
        }
      })(),
    };

    res.json({
      status: true,
      message: "Semua tipe parameter berhasil diterima",
      received: result,
      timestamp: new Date().toISOString(),
    });
  },
};
