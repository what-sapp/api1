import { db } from "../../lib/db.js";

export default {
  path: "/api/admin/delimit",
  method: "POST",

  access: {
    register: true,
    apikey: true,
    admin: true,
  },

  info: [
  {
    name: "Kurangi Limit",
    status: "Ready",
    method: "POST",
    desc: "Mengurangi limit request user berdasarkan ID",
    params: [
      {
        name: "id",
        type: "string",
        required: true,
        example: "usr_xxxxx",
        desc: "ID user target",
      },
      {
        name: "limit",
        type: "number",
        required: true,
        example: 5,
        desc: "Jumlah limit yang akan dikurangi",
      },
    ],
  },
],

  execution: async (req, res) => {
    let body = "";

    for await (const chunk of req) {
      body += chunk;
    }

    let data = {};
    try {
      data = JSON.parse(body || "{}");
    } catch {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "Body harus JSON",
        }),
      );
    }

    const { id, limit } = data;

    if (!id || typeof limit !== "number") {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "Parameter id dan limit wajib",
        }),
      );
    }

    if (limit <= 0) {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "Limit harus lebih dari 0",
        }),
      );
    }

    await db.load(); // 🔥 FIX: reload data

    const target = db.data.users.find((u) => u.id === id);

    if (!target) {
      return res.writeHead(404).end(
        JSON.stringify({
          status: false,
          message: "User tidak ditemukan",
        }),
      );
    }

    const before = target.limit ?? 0;

    if (before - limit < 0) {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "Limit user tidak mencukupi",
          data: {
            limit_now: before,
            limit_request: limit,
          },
        }),
      );
    }

    target.limit = before - limit;
    target.updatedAt = new Date().toISOString();

    await db.save(); // 🔥 FIX: simpan perubahan

    return res.writeHead(200).end(
      JSON.stringify({
        status: true,
        message: "Limit berhasil dikurangi",
        data: {
          id: target.id,
          username: target.username,
          limit_before: before,
          limit_reduced: limit,
          limit_now: target.limit,
        },
      }),
    );
  },
};