import axios from "axios";

export default {
  path: "/api/sticker/brat",
  method: "GET",

  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Brat Sticker",
      status: "Ready",
      method: "GET",
      desc: "Generate brat sticker dalam bentuk image atau gif",
      params: [
        {
          name: "text",
          type: "text",
          required: true,
          placeholder: "contoh: halo dunia",
        },
        {
          name: "type",
          type: "select",
          required: true,
          options: [
            { label: "Image (PNG)", value: "image" },
            { label: "Animated GIF", value: "gif" },
          ],
        },
        {
          name: "delay",
          type: "number",
          required: false,
          placeholder: "khusus gif (contoh: 1000)",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const u = new URL(req.url, `http://${req.headers.host}`);
      const text = u.searchParams.get("text");
      const type = u.searchParams.get("type") || "image";
      const delay = u.searchParams.get("delay") || 50;

      if (!text) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
           status: false,
            message: "Parameter text wajib diisi",
          })
        );
      }

      if (!["image", "gif"].includes(type)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Type harus image atau gif",
          })
        );
      }

      let apiUrl;

      if (type === "gif") {
        apiUrl = `https://brat.siputzx.my.id/gif?text=${encodeURIComponent(
          text
        )}&delay=${delay}`;
      } else {
        apiUrl = `https://brat.siputzx.my.id/image?text=${encodeURIComponent(
          text
        )}`;
      }

      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
      });

      res.writeHead(200, {
        "Content-Type": type === "gif" ? "image/gif" : "image/png",
        "Content-Length": response.data.length,
      });

      res.end(response.data);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: "Gagal generate brat sticker",
          error: e.message,
        })
      );
    }
  },
};