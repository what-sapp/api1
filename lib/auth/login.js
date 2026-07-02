import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { getPublicIP, getSafeUser } from "./helpers.js";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function loginUser(req, data) {
  const { username, password } = data;
  const user = db.data.users.find(
    (u) => u.username === username || u.email === username,
  );
  if (!user) {
    return {
      status: false,
      message: "User tidak ditemukan",
    };
  }

  const match = await bcrypt.compare(password, user.password || "");

  if (!match) {
    return {
      status: false,
      message: "Password salah",
    };
  }

  user.lastLogin = new Date().toISOString();
  user.loginCount++;
  user.ip = getPublicIP(req);

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
