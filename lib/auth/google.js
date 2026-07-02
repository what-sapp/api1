import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db.js";
import { makeid, getPublicIP, getSafeUser } from "./helpers.js";
const JWT_SECRET = "secret";

const DEFAULT_AVATAR =
  "https://files.catbox.moe/9ceimm.png";
const GOOGLE_CLIENT_ID =
  "testestes"; // ganti pake punya lu hmmbelum gau pindahin ke env em

const GOOGLE_CLIENT_SECRET =
  "testestes"; //ganti pake punya lu

const GOOGLE_REDIRECT =
  "https://localhost:3000/auth/google/callback";

export function getGoogleClient() {
  console.log("CLIENT:", GOOGLE_CLIENT_ID);

  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT,
  );
}

export async function handleGoogleCallback(
  req,
  code,
) {
  try {
    const googleClient =
      getGoogleClient();

    const { tokens } =
      await googleClient.getToken({
        code,
        redirect_uri:
          GOOGLE_REDIRECT,
      });

    googleClient.setCredentials(tokens);

    const gRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    const gUser = await gRes.json();

    let user = db.data.users.find(
      (u) => u.email === gUser.email,
    );

    const now = moment()
      .tz("Asia/Jakarta")
      .format("YYYY-MM-DD HH:mm:ss");

    if (!user) {
      user = {
        id: "usr_" + makeid(8),
        name: gUser.name,
        username:
          gUser.email.split("@")[0],
        email: gUser.email,
        phone: null,
        country: "ID",
        password: null,
        provider: "google",
        avatar:
          gUser.picture ||
          DEFAULT_AVATAR,
        bio: "",
        role: "user",
        owner: false,
        admin: false,
        premium: false,
        premiumStart: null,
        premiumEnds: null,
        apikey:
          "rhnx_" + makeid(9),
        limit: 100,
        ip: getPublicIP(req),
        createdAt: now,
        updatedAt: now,
        loginCount: 1,
        lastLogin: now,
      };

      db.data.users.push(user);
    } else {
      user.lastLogin = now;
      user.loginCount++;
      user.ip = getPublicIP(req);
    }

    await db.save();

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return {
      status: true,
      token,
      user: getSafeUser(user),
    };
  } catch (err) {
    console.error(err);

    return {
      status: false,
      message: err.message,
    };
  }
}