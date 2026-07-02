import { db } from "../../lib/db.js";

export default {
  path: "/api/owner/addadmin",
  method: "POST",

  access: {
    register: true,
    owner: true,
    apikey: true,
  },

  info: [
    {
      name: "Add Admin",
      status: "Ready",
      method: "POST",
      desc: "Menjadikan user sebagai admin (khusus owner)",
      params: [
        {
          name: "id",
          type: "string",
          required: true,
          placeholder: "usr_xxxxx",
          desc: "ID user yang akan dijadikan admin",
        },
      ],
      example: {
        id: "usr_abcd1234",
      },
    },
  ],

  execution: async (req, res) => {
    let body = "";

    for await (const chunk of req) body += chunk;

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

    const { id } = data;

    if (!id) {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "Parameter id wajib",
        }),
      );
    }

    const target = db.data.users.find((u) => u.id === id);

    if (!target) {
      return res.writeHead(404).end(
        JSON.stringify({
          status: false,
          message: "User tidak ditemukan",
        }),
      );
    }

    if (target.owner) {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "Owner tidak perlu dijadikan admin",
        }),
      );
    }

    if (target.admin) {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "User sudah admin",
        }),
      );
    }

    target.admin = true;
    target.role = "admin";
    target.updatedAt = new Date().toISOString();

    await db.save();

    return res.writeHead(200).end(
      JSON.stringify({
        status: true,
        message: "Berhasil menjadikan admin",
        data: {
          id: target.id,
          username: target.username,
          role: target.role,
          admin: true,
        },
      }),
    );
  },
};