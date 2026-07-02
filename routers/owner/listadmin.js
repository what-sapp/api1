import { db } from "../../lib/db.js";

export default {
  path: "/api/owner/listadmin",
  method: "GET",

  access: {
    register: true,
    apikey: true,
    owner: true,
  },

  info: [
    {
      name: "List Admin",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan semua user dengan role admin",
    },
  ],

  execution: async (req, res) => {
    await db.load(); // 🔥 reload data terbaru

    const admins = db.data.users
      .filter((u) => u.admin === true)
      .map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        admin: u.admin,
        owner: u.owner,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        status: true,
        total: admins.length,
        data: admins,
      }),
    );
  },
};