import { createCanvas, loadImage } from "canvas";

export default {
  path: "/api/rankcard",
  method: "GET",

  access: {
    register: false,
    apikey: false,
  },

  info: [
    {
      name: "Rank Card",
      status: "Ready",
      method: "GET",
      desc: "Generate rank card image with avatar URL, name, rank, and progress bar",

      params: [
        { name: "name", type: "string", placeholder: "User Name" },
        { name: "text", type: "string", placeholder: "Description" },
        { name: "rank", type: "string", placeholder: "GOLD" },
        { name: "value", type: "number", placeholder: "70" },
        { name: "max", type: "number", placeholder: "100" },
        {
          name: "avatar",
          type: "string",
          placeholder: "https://example.com/avatar.png",
        },
        {
          name: "color",
          type: "string",
          placeholder: "#3b82f6",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      // ================= PARAM =================
      const name = url.searchParams.get("name") || "User Name";
      const text = url.searchParams.get("text") || "Description";
      const rank = url.searchParams.get("rank") || "RANK";

      const value = Number(url.searchParams.get("value")) || 70;
      const max = Number(url.searchParams.get("max")) || 100;
      const percent = Math.min(value / max, 1);

      const avatarUrl = url.searchParams.get("avatar");
      const barColor = url.searchParams.get("color") || "#3b82f6";

      // ================= CANVAS =================
      const width = 560;
      const height = 150;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ================= BG CARD =================
      const radius = 20;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.arcTo(width, 0, width, height, radius);
      ctx.arcTo(width, height, 0, height, radius);
      ctx.arcTo(0, height, 0, 0, radius);
      ctx.arcTo(0, 0, width, 0, radius);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#e5e7eb";
      ctx.stroke();

      // ================= TEXT LEFT =================
      ctx.fillStyle = "#111827";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(name, 24, 36);

      ctx.fillStyle = "#6b7280";
      ctx.font = "14px sans-serif";
      ctx.fillText(text, 24, 60);

      // ================= AVATAR (CENTER) =================
      const avatarSize = 80;
      const avatarX = width / 2 - avatarSize / 2;
      const avatarY = height / 2 - avatarSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();

      if (avatarUrl) {
        try {
          const img = await loadImage(avatarUrl);
          ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        } catch {
          ctx.fillStyle = "#e5e7eb";
          ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        }
      } else {
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      }
      ctx.restore();

      // ================= RANK + BAR =================
      const barX = avatarX + avatarSize + 24;
      const barY = avatarY + 26;
      const barWidth = width - barX - 24;
      const barHeight = 14;

      ctx.fillStyle = "#111827";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(rank, barX, barY - 8);

      // bar bg
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // bar progress
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, barWidth * percent, barHeight);

      // percent text
      ctx.fillStyle = "#111827";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        `${Math.floor(percent * 100)}%`,
        barX + barWidth - 40,
        barY + barHeight + 14
      );

      // ================= RESPONSE =================
      const buffer = canvas.toBuffer("image/png");
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length,
      });
      res.end(buffer);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: err.message,
        })
      );
    }
  },
};
