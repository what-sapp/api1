import canvas from "canvas";
import path from "path";
import fs from "fs";

const { createCanvas, loadImage, registerFont } = canvas;

export default {
  path: "/api/canvas/rank",
  method: "GET",

  access: {
    register: false,
  },

  info: [
    {
      name: "Game Level Up Card",
      status: "Ready",
      method: "GET",
      desc: "Generate level up card full background dengan avatar segitiga kiri",
      params: [
        { name: "avatar", type: "string", placeholder: "URL avatar image" },
        { name: "name", type: "string", placeholder: "Nama player" },
        { name: "rank", type: "string", placeholder: "Diamond III" },
        { name: "level", type: "number", placeholder: "45" },
        { name: "xp", type: "number", placeholder: "650" },
        { name: "maxXp", type: "number", placeholder: "1000" },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      const avatarUrl =
        url.searchParams.get("avatar") ||
        "https://i.imgur.com/OVQ8s8h.jpeg";

      const name = url.searchParams.get("name") || "Raihan";
      const rank = url.searchParams.get("rank") || "Diamond III";
      const level = Number(url.searchParams.get("level") || 45);
      const xp = Number(url.searchParams.get("xp") || 650);
      const maxXp = Number(url.searchParams.get("maxXp") || 1000);

      const width = 900;
      const height = 300;

      const c = createCanvas(width, height);
      const ctx = c.getContext("2d");

      const fontPath = path.join(
        process.cwd(),
        "media",
        "fonts",
        "gemeli.ttf",
      );

      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, {
          family: "CustomFont",
        });
      }

      const font = fs.existsSync(fontPath) ? "CustomFont" : "Arial";

      // BACKGROUND FULL
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#28d7ee");
      bg.addColorStop(0.52, "#19a9f2");
      bg.addColorStop(1, "#4057e8");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawPattern(ctx, width, height);
      drawGlow(ctx, 160, 80, 220, "rgba(255,255,255,0.20)");
      drawGlow(ctx, 780, 260, 260, "rgba(255,255,255,0.14)");

      // AVATAR SEGITIGA FULL KIRI
      const avatar = await loadImage(avatarUrl);

      const avatarW = 340;
      const triangleX = 260;
      const pointX = 350;

      ctx.save();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(triangleX, 0);
      ctx.lineTo(pointX, height / 2);
      ctx.lineTo(triangleX, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.clip();

      coverImage(ctx, avatar, 0, 0, avatarW, height);

      ctx.restore();

      // GARIS PUTIH SEGITIGA
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(triangleX, 0);
      ctx.lineTo(pointX, height / 2);
      ctx.lineTo(triangleX, height);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // TEXT AREA
      const textX = 390;

      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = `24px "${font}"`;
      ctx.fillText("LEVEL UP", textX, 62);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 48px "${font}"`;
      fillEllipsis(ctx, name, textX, 110, 330);

      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = `30px "${font}"`;
      fillEllipsis(ctx, rank, textX, 160, 320);

      // LEVEL BOX
      roundRect(ctx, 720, 62, 120, 92, 22);
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.38)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = `20px "${font}"`;
      ctx.fillText("LEVEL", 780, 92);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 44px "${font}"`;
      ctx.fillText(String(level), 780, 130);

      // XP BAR
      const barX = textX;
      const barY = 214;
      const barW = 455;
      const barH = 22;

      roundRect(ctx, barX, barY, barW, barH, 999);
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fill();

      const percent = Math.max(0, Math.min(1, xp / maxXp));

      roundRect(ctx, barX, barY, barW * percent, barH, 999);

      const xpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      xpGrad.addColorStop(0, "#ffffff");
      xpGrad.addColorStop(0.5, "#dff7ff");
      xpGrad.addColorStop(1, "#bae6fd");

      ctx.fillStyle = xpGrad;
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = `21px "${font}"`;
      ctx.fillText(`${xp} / ${maxXp} XP`, barX, 258);

      ctx.restore();

      const buffer = c.toBuffer("image/png");

      res.writeHead(200, {
        "Content-Type": "image/png",
      });

      return res.end(buffer);
    } catch (err) {
      console.error(err);

      return res.json({
        status: false,
        message: err.message,
      });
    }
  },
};

function drawPattern(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  for (let i = 0; i < 16; i++) {
    const startY = -80 + i * 28;

    ctx.beginPath();
    ctx.moveTo(-100, startY);
    ctx.bezierCurveTo(
      width * 0.25,
      startY + 85,
      width * 0.65,
      startY - 105,
      width + 120,
      startY + 12,
    );
    ctx.stroke();
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function coverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;

  let drawW;
  let drawH;
  let drawX;
  let drawY;

  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = img.width * (h / img.height);
    drawX = x - (drawW - w) / 2;
    drawY = y;
  } else {
    drawW = w;
    drawH = img.height * (w / img.width);
    drawX = x;
    drawY = y - (drawH - h) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function drawGlow(ctx, x, y, r, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function fillEllipsis(ctx, text, x, y, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  let result = text;

  while (
    result.length > 0 &&
    ctx.measureText(result + "...").width > maxWidth
  ) {
    result = result.slice(0, -1);
  }

  ctx.fillText(result + "...", x, y);
}