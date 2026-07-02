import { db } from "../../lib/db.js";

export default {
  path: "/api/admin/cekuser",
  method: "GET",
  access: {
    register: true,
    admin: true,
    apikey: true,
  },

  info: [
    {
      name: "Check User",
      status: "Ready",
      method: "GET",
      desc: "Melihat detail data user berdasarkan id",
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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Parameter id wajib diisi",
        }),
      );
    }

    const user = db.data.users.find((u) => u.id === id);

    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "User tidak ditemukan",
        }),
      );
    }

    const result = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      owner: user.owner,
      admin: user.admin,
      premium: user.premium,
      premiumStart: user.premiumStart,
      premiumEnds: user.premiumEnds,
      limit: user.limit,
      apikey: user.apikey,
      ip: user.ip,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        status: true,
        creator: "Raihan Fadillah",
        requester: req.user?.username || null,
        data: result,
      }),
    );
  },
};