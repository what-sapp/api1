import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import {
  getGoogleClient,
  handleGoogleCallback,
} from "./lib/auth/google.js";
import { db } from "./lib/db.js";
import { getSafeUser } from "./lib/auth/helpers.js";
import { registerUser } from "./lib/auth/register.js";
import { loginUser } from "./lib/auth/login.js";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function handleMain(
  req,
  res,
  { pathname, parsedUrl, __dirname, json, serveFile, getEndpointInfo },
) {

  if (req.method === "GET" && pathname === "/api/folders") {
    const filePath = path.join(__dirname, "views/data/folders.json");

    return fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return json(res, 500, {
          status: false,
        });
      }

      return json(res, 200, JSON.parse(data));
    });
  }

  if (req.method === "GET" && pathname === "/api/endpoints") {
    const folder = parsedUrl.searchParams.get("folder");
    let endpoints = getEndpointInfo();
    if (folder) {
      endpoints = endpoints.filter((e) => e.folder === folder);
    }
    return json(res, 200, endpoints);
  }

  if (pathname === "/api/report" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });
    return req.on("end", async () => {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
      const reportPath = path.join(__dirname, "database/report.json");
      if (!fs.existsSync(reportPath)) {
        fs.writeFileSync(reportPath, "[]");
      }
      let reports;
      try {
        reports = JSON.parse(fs.readFileSync(reportPath, "utf8"));
        if (!Array.isArray(reports)) {
          reports = [];
        }
      } catch {
        reports = [];
      }
      reports.unshift({
        id: "RPT-" + Math.random().toString(36).slice(2, 10),
        endpoint: body.endpoint || "unknown",
        method: body.method || "GET",
        type: body.type || "unknown",
        detail: body.detail || "no detail",
        output: body.output || null,
        createdAt: new Date().toISOString(),
      });
      fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
      return json(res, 200, {
        status: true,
        message: "Report berhasil dikirim",
      });
    });
  }
    
  if (req.method === "GET" && pathname === "/api/changelog") {
    const filePath = path.join(__dirname, "database/changelog.json");

    return fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return json(res, 500, {
          status: false,
        });
      }

      return json(res, 200, JSON.parse(data));
    });
  }

  if (pathname === "/api/register" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    return req.on("end", async () => {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }

      const result = await registerUser(req, body);

      return json(res, result.status ? 200 : 400, result);
    });
  }

  if (pathname === "/api/login" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    return req.on("end", async () => {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }

      const result = await loginUser(req, body);
      return json(res, result.status ? 200 : 401, result);
    });
  }

  if (pathname === "/auth/google") {
  const googleClient =
    getGoogleClient();

  const url =
    googleClient.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["profile", "email"],
    });

  console.log(url);

  res.writeHead(302, {
    Location: url,
  });

  return res.end();
}

if (pathname === "/auth/google/callback") {
  const code =
    parsedUrl.searchParams.get("code");

  const result =
    await handleGoogleCallback(
      req,
      code,
    );

  if (!result.status) {
    return json(res, 400, result);
  }

  const encoded = Buffer.from(
    JSON.stringify(result.user),
  ).toString("base64");

  res.writeHead(302, {
    Location:
      `/auth-success.html?data=${encoded}` +
      `&token=${result.token}`,
  });

  return res.end();
}

  if (pathname === "/api/user" && req.method === "GET") {
    db.load();

    const token = req.headers["authorization"];

    if (!token) {
      return json(res, 401, {
        status: false,
        message: "Token tidak ada",
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.data.users.find((u) => u.id === decoded.id);

      if (!user) {
        return json(res, 404, {
          status: false,
          message: "User tidak ditemukan",
        });
      }

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      return res.end(
        JSON.stringify({
          status: true,
          user: getSafeUser(user),
        }),
      );
    } catch (err) {
      console.error(err);

      return json(res, 401, {
        status: false,
        message: "Token tidak valid",
      });
    }
  }

  if (pathname === "/api/update-profile" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    return req.on("end", async () => {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }

      const token = req.headers["authorization"];

      if (!token) {
        return json(res, 401, {
          status: false,
          message: "Token tidak ada",
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = db.data.users.find((u) => u.id === decoded.id);

        if (!user) {
          return json(res, 404, {
            status: false,
            message: "User tidak ditemukan",
          });
        }

        // update data
        if (body.name) user.name = body.name;

        if (body.bio) user.bio = body.bio;

        if (body.avatar) user.avatar = body.avatar;

        if (body.phone && !user.phone) {
          user.phone = body.phone;
        }

        user.updatedAt = new Date().toISOString();

        db.save();

        return json(res, 200, {
          status: true,
          message: "Profile berhasil diupdate",
          user: getSafeUser(user),
        });
      } catch (err) {
        console.error(err);

        return json(res, 401, {
          status: false,
          message: "Token tidak valid",
        });
      }
    });
  }
  return false;
}
