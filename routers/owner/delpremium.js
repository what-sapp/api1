import { db } from "../../lib/db.js";
import moment from "moment-timezone";

export default {
  path: "/api/admin/delpremium",
  method: "POST",

  access: {
    register: true,
    admin: true,
    apikey: true,
  },

  info: [
    {
      name: "Delete Premium",
      status: "Ready",
      method: "POST",
      desc: "Menghapus status premium dari user",
      params: [
        {
          name: "id",
          type: "string",
          required: true,
          placeholder: "usr_xxxxx",
          desc: "ID user yang akan dihapus premium-nya",
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

    const user = db.data.users.find((u) => u.id === id);

    if (!user) {
      return res.writeHead(404).end(
        JSON.stringify({
          status: false,
          message: "User tidak ditemukan",
        }),
      );
    }

    if (!user.premium) {
      return res.writeHead(400).end(
        JSON.stringify({
          status: false,
          message: "User bukan premium",
        }),
      );
    }

    // reset premium
    user.premium = false;
    user.premiumStart = null;
    user.premiumEnds = null;
    user.updatedAt = moment()
      .tz("Asia/Jakarta")
      .format("YYYY-MM-DD HH:mm:ss");

    await db.save();

    return res.writeHead(200).end(
      JSON.stringify({
        status: true,
        message: "Premium berhasil dihapus",
        data: {
          id: user.id,
          username: user.username,
          premium: false,
        },
      }),
    );
  },
};