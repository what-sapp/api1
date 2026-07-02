import { db } from "../../lib/db.js";

export default {
  path: "/api/owner/listowner",
  method: "GET",

  access: {
    owner: true,
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "List Owner",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan daftar user yang memiliki role owner",
    },
  ],

  execution: async (req, res) => {
    const owners = db.data.users
      .filter((u) => u.owner === true)
      .map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        status: true,
        total: owners.length,
        data: owners,
      }),
    );
  },
};