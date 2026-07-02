import https from "https";

export function makeid(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

export function getPublicIP(req) {
  let ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "";
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip || "Unknown";
}

export function getSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    owner: user.owner,
    admin: user.admin,
    premium: user.premium,
    premiumStart: user.premiumStart,
    premiumEnds: user.premiumEnds,
    apikey: user.apikey,
    limit: user.limit,
    phone: user.phone,
    ip: user.ip,
    provider: user.provider,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    loginCount: user.loginCount,
    lastLogin: user.lastLogin,
  };
}
