import { db } from "../../lib/db.js";
import moment from "moment-timezone";

export default {
  path: "/api/admin/addpremium",
  method: "POST",
  access: {
    register:true,
    admin: true,
    apikey:true,
  },

  info: [
    {
      name: "Add Premium",
      status: "Ready",
      method: "POST",
      desc: "Memberikan premium ke user dengan durasi (jam / hari / bulan)",
      params: [
        {
          name: "id",
          type: "string",
          required: true,
          placeholder: "usr_xxxxx",
        },
        {
          name: "duration",
          type: "number",
          required: true,
          placeholder: "Contoh: 7",
        },
        {
          name: "type",
          type: "select",
          required: true,
          placeholder: "Pilih durasi",
          options: ["hour", "day", "month"],
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

    const { id, duration, type } = data;

    if (!id || !duration || !type) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "id, duration, dan type wajib diisi",
        })
      );
    }

    if (!["hour", "day", "month"].includes(type)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "type harus: hour | day | month",
        })
      );
    }

    const user = db.data.users.find((u) => u.id === id);

    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: false,
          message: "User tidak ditemukan",
        })
      );
    }

    const now = moment().tz("Asia/Jakarta");

    let end;
    if (type === "hour") end = now.clone().add(duration, "hours");
    if (type === "day") end = now.clone().add(duration, "days");
    if (type === "month") end = now.clone().add(duration, "months");

    user.premium = true;
    user.premiumStart = now.format("YYYY-MM-DD HH:mm:ss");
    user.premiumEnds = end.format("YYYY-MM-DD HH:mm:ss");
    user.updatedAt = now.format("YYYY-MM-DD HH:mm:ss");

    await db.save();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        message: "Premium berhasil ditambahkan",
        data: {
          id: user.id,
          username: user.username,
          premium: true,
          start: user.premiumStart,
          ends: user.premiumEnds,
          duration: `${duration} ${type}`,
        },
      })
    );
  },
};
