export default {
  path: "/api/converter/binary",
  method: "POST",

  access: {
    register: true,
    apikey:true,
  },

  info: [
    {
      name: "Binary",
      status: "Ready",
      method: "POST",
      desc: "Convert text ↔ binary",
      params: [
        {
          name: "action",
          type: "select",
          required: true,
          options: ["textToBinary", "binaryToText"],
        },
        {
          name: "data",
          type: "text",
          required: true,
          placeholder: "Masukkan text atau binary (pisahkan dengan spasi)",
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

      if (action === "textToBinary") {
        result = data
          .split("")
          .map((char) =>
            char.charCodeAt(0).toString(2).padStart(8, "0")
          )
          .join(" ");
      } 
      else if (action === "binaryToText") {
        try {
          result = data
            .trim()
            .split(/\s+/)
            .map((bin) => {
              if (!/^[01]+$/.test(bin))
                throw new Error("Invalid binary format");
              return String.fromCharCode(parseInt(bin, 2));
            })
            .join("");
        } catch {
          return res.end(
            JSON.stringify({
              status: false,
              message:
                "Format binary tidak valid. Pisahkan tiap 8-bit dengan spasi.",
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