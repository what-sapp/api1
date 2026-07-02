import { db } from "../../lib/db.js";
export default {
  path: "/api/owner/deladmin",
  method: "POST",
  access: {
    owner: true,
    register:true,
  },
  info: [
    {
      name: "Delete Admin",
      status: "Ready",
      method: "POST",
      desc: "Menghapus role admin dari user (khusus owner)",
      params: [
        {
          name: "id",
          type: "string",
          required: true,
          placeholder: "usr_xxxxx",
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

    const { id } = data;

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Parameter id wajib",
        })
      );
    }

    const target = db.data.users.find((u) => u.id === id);

    if (!target) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "User tidak ditemukan",
        })
      );
    }

    if (target.owner) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Owner tidak bisa dihapus adminnya",
        })
      );
    }

    if (!target.admin) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "User bukan admin",
        })
      );
    }

    target.admin = false;
    target.role = "user";
    target.updatedAt = new Date().toISOString();

    await db.save();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
       status: true,
        message: "Admin berhasil dihapus",
        data: {
          id: target.id,
          username: target.username,
          role: target.role,
        },
      })
    );
  },
};
