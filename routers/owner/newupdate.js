import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  path: "/api/admin/addchangelog",
  method: "POST",
  access: {
    admin: true,
      register:true,
      apikey:true,
      admin:true,
  },

  info: [
    {
      name: "Add Changelog",
      status: "Ready",
      method: "POST",
      desc: "Menambahkan changelog baru (tanggal otomatis WIB)",
      params: [
        {
          name: "desc",
          type: "string",
          required: true,
          placeholder: "Tambah fitur baru",
        },
      ],
    },
  ],

  execution: async (req, res) => {
   
    let body = "";
    for await (const chunk of req) body += chunk;

    let data = {};
    try {
      data = JSON.parse(body || "{}");
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Body harus JSON",
        })
      );
    }

    const { desc } = data;

    if (!desc) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Parameter desc wajib",
        })
      );
    }

    const date = moment().tz("Asia/Jakarta").format("DD/MM/YYYY");

    const changelogPath = path.join(__dirname, "../../database/changelog.json");

    let changelogs = [];

    if (fs.existsSync(changelogPath)) {
      try {
        changelogs = JSON.parse(
          fs.readFileSync(changelogPath, "utf-8") || "[]"
        );
      } catch {
        changelogs = [];
      }
    }

    const newLog = { date, desc };
    changelogs.unshift(newLog);

    fs.writeFileSync(changelogPath, JSON.stringify(changelogs, null, 2));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "Changelog berhasil ditambahkan",
        data: newLog,
      })
    );
  },
};
