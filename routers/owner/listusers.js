import fs from "fs";
import path from "path";

export default {
  path: "/api/admin/listuser",
  method: "GET",
  access: {
    register: true,
    apikey: true,
    admin: true,
  },

  info: [
    {
      name: "List User",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan semua data user dari database",
      params: [],
    },
  ],

  execution: async (req, res) => {
    try {
      const dbPath = path.join(process.cwd(), "database", "database.json");
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            total: db.users?.length || 0,
            users: db.users || [],
          },
          null,
          2
        )
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: "Gagal mengambil data user",
          error: err.message,
        })
      );
    }
  },
};
