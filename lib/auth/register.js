import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import { db } from "../db.js";
import { makeid, getPublicIP, getSafeUser } from "./helpers.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const DEFAULT_AVATAR = "https://files.catbox.moe/9ceimm.png";

export async function registerUser(req, data) {
  const { username, password, name, email, phone, country } = data;

  if (!username || !password || !name || !email) {
    return {
      status: false,
      message: "Field wajib belum lengkap",
    };
  }

  const exists = db.data.users.find(
    (u) => u.username === username || u.email === email,
  );

  if (exists) {
    return {
      status: false,
      message: "Username atau email sudah digunakan",
    };
  }

  const hashed = await bcrypt.hash(password, 10);
  const now = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

  const user = {
    id: "usr_" + makeid(8),
    name,
    username,
    email,
    phone: phone || null,
    country: country || "ID",
    password: hashed,
    provider: "local",
    avatar: DEFAULT_AVATAR,
    bio: "",
    role: "user",
    owner: false,
    admin: false,
    premium: false,
    premiumStart: null,
    premiumEnds: null,
    apikey: "rhnx_" + makeid(9),
    limit: 100,
    ip: getPublicIP(req),
    createdAt: now,
    updatedAt: now,
    loginCount: 0,
    lastLogin: null,
  };

  db.data.users.push(user);
  db.save();

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  return {
    status: true,
    token,
    user: getSafeUser(user),
  };
}
