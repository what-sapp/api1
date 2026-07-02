// middleware/handleAccess.js

import { db } from "../lib/db.js";

function send(res, code, message) {
  res.writeHead(code, {
    "Content-Type": "application/json",
  });

  res.end(
    JSON.stringify({
      creator: "Raihan Fadillah",
      status: false,

      info: {
        message,
      },
    }),
  );
}

export async function handleAccess(req, res, access = {}) {

  if (!access || Object.keys(access).length === 0) {
    return true;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  const apiKey =
    req.headers["x-api-key"] ||
    url.searchParams.get("key") ||
    url.searchParams.get("apikey");

  let user = null;

  if (
    access.register ||
    access.limit ||
    access.admin ||
    access.owner ||
    access.premium
  ) {
    if (!apiKey) {
      send(res, 401, "API Key diperlukan, silakan login terlebih dahulu");

      return false;
    }

    user = db.data.users.find((u) => u.apikey === apiKey);

    if (!user) {
      send(res, 401, "Invalid API Key");
      return false;
    }

    req.user = user;
  }

  if (access.owner && !user.owner) {
    send(res, 403, "Hanya owner yang dapat mengakses endpoint ini");

    return false;
  }

if (access.admin && !user.admin && !user.owner) {
  send(res, 403, "Admin only");

  return false;
}

  if (access.premium && !user.premium) {
    send(res, 403, "Fitur khusus user premium");

    return false;
  }

  if (access.limit) {
    if (typeof user.limit !== "number") {
      user.limit = 0;
    }

    if (user.premium) {
      return true;
    }

    if (user.limit <= 0) {
      send(
        res,
        429,
        "Limit request habis, upgrade premium untuk unlimited request",
      );

      return false;
    }

    user.limit -= 1;

    db.save();
  }

  return true;
}
