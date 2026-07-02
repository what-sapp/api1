export default {
  path: "/api/converter/base64",
  method: "POST",
  access: {
    register: true,
    apikey:true,
  },

  info: [
    {
      name: "Base64",
      status: "Ready",
      method: "POST",
      desc: "Convert text ↔ base64 dalam satu endpoint",
      params: [
        {
          name: "action",
          type: "select",
          required: true,
          options: ["textToBase64", "base64ToText"],
        },
        {
          name: "data",
          type: "text",
          required: true,
          placeholder: "Masukkan text atau base64 di sini",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      let body = "";
      for await (const chunk of req) body += chunk;

      const { action, data } = JSON.parse(body || "{}");

      if (!action || !data) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "action dan data wajib diisi",
          })
        );
      }

      let result;

      if (action === "textToBase64") {
        result = Buffer.from(data, "utf-8").toString("base64");
      } 
      else if (action === "base64ToText") {
        try {
          result = Buffer.from(data, "base64").toString("utf-8");
        } catch {
          return res.end(
            JSON.stringify({
              status: false,
              message: "Format base64 tidak valid",
            })
          );
        }
      } 
      else {
        return res.end(
          JSON.stringify({
            status: false,
            message: "action tidak dikenal",
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            action,
            input: data,
            result,
          },
          null,
          2
        )
      );
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: e.message,
        })
      );
    }
  },
};