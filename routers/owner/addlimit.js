import { db } from "../../lib/db.js";
export default {
  path: "/api/admin/addlimit",
  method: "POST",
 access: {
    register:true,
    admin:true,
    apikey:true,
  },
  info: [
    {
      name: "Add Limit",
      status: "Ready",
      method: "POST",
      desc: "Menambahkan limit request ke user",
      params: [
        {
          name: "id",
          type: "string",
          required: true,
          placeholder: "usr_xxxxx",
        },
        {
          name: "limit",
          type: "number",
          required: true,
          placeholder: 10,
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

    const { id, limit } = data;

    if (!id || typeof limit !== "number") {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Parameter id dan limit wajib",
        })
      );
    }
await db.load(); 
    
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

    const before = target.limit ?? 0;
    target.limit = before + limit;
    target.updatedAt = new Date().toISOString();

    await db.save();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "Limit berhasil ditambahkan",
        data: {
          id: target.id,
          username: target.username,
          limit_before: before,
          limit_added: limit,
          limit_now: target.limit,
        },
      })
    );
  },
};
