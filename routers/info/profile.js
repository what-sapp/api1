export default {
  path: "/api/info/profile",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Profile",
      status: "Ready",
      method: "GET",
      desc: "Mengambil data profile user berdasarkan API key",
    },
  ],

  execution: (req, res) => {
    const user = req.user;

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: false,
          message: "Unauthorized",
        }),
      );
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        creator: "Raihan Fadillah",
        status: true,
        user: user.username,
        data: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          country: user.country,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          owner: user.owner,
          admin: user.admin,
          premium: user.premium,
          premiumStart: user.premiumStart,
          premiumEnds: user.premiumEnds,
          limit: user.limit,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      }),
    );
  },
};
