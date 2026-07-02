import canvas from "canvas";
import path from "path";
import fs from "fs";

const { createCanvas, loadImage, registerFont } = canvas;

export default {
  path: "/api/canvas/welcome",
  method: "GET",

  access: {
    register: false,
  },

  info: [
    {
      name: "Canvas Welcome Card",
      status: "Ready",
      method: "GET",
      desc: "Generate welcome canvas image",

      params: [
        {
          name: "avatar",
          type: "string",
          placeholder: "URL avatar image",
        },
        {
          name: "name",
          type: "string",
          placeholder: "Nama member",
        },
        {
          name: "role",
          type: "string",
          placeholder: "Role member",
        },
        {
          name: "title",
          type: "string",
          placeholder: "Welcome title",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      const avatarUrl =
        url.searchParams.get("avatar") ||
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

      const name =
        url.searchParams.get("name") ||
        "Keren Arzi Raviv";

      const role =
        url.searchParams.get("role") ||
        "Clinical Operation Manager";

      const title =
        url.searchParams.get("title") ||
        "Welcome Aboard!";

      const width = 1280;
      const height = 720;

      const c = createCanvas(width, height);
      const ctx = c.getContext("2d");

      // =========================
      // FONT
      // =========================

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

      // =========================
      // BG
      // =========================

      const bg = ctx.createLinearGradient(
        0,
        0,
        width,
        height,
      );

      bg.addColorStop(0, "#28d7ee");
      bg.addColorStop(0.52, "#19a9f2");
      bg.addColorStop(1, "#4057e8");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // =========================
      // PATTERN
      // =========================

      ctx.save();

      ctx.strokeStyle =
        "rgba(255,255,255,0.18)";

      ctx.lineWidth = 12;
      ctx.lineCap = "round";

      for (let i = 0; i < 22; i++) {
        const startY = -70 + i * 34;

        ctx.beginPath();

        ctx.moveTo(-120, startY);

        ctx.bezierCurveTo(
          width * 0.25,
          startY + 110,

          width * 0.65,
          startY - 140,

          width + 140,
          startY + 10,
        );

        ctx.stroke();
      }

      ctx.restore();

      // =========================
      // LOAD AVATAR
      // =========================

      const avatar = await loadImage(
        avatarUrl,
      );

      const cx = width / 2;
      const centerY = height / 2;

      // =========================
      // TITLE
      // =========================

      ctx.save();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#ffffff";

      ctx.font =
        'bold 52px "CustomFont"';

      ctx.fillText(
        title,
        cx,
        centerY - 165,
      );

      ctx.restore();

      // =========================
      // AVATAR
      // =========================

      const size = 230;
      const r = size / 2;

      ctx.save();

      ctx.beginPath();

      ctx.arc(
        cx,
        centerY,
        r,
        0,
        Math.PI * 2,
      );

      ctx.closePath();
      ctx.clip();

      const imgRatio =
        avatar.width / avatar.height;

      let drawW;
      let drawH;
      let drawX;
      let drawY;

      if (imgRatio > 1) {
        drawH = size;

        drawW =
          avatar.width *
          (size / avatar.height);

        drawX = cx - drawW / 2;
        drawY = centerY - size / 2;
      } else {
        drawW = size;

        drawH =
          avatar.height *
          (size / avatar.width);

        drawX = cx - size / 2;
        drawY = centerY - drawH / 2;
      }

      ctx.drawImage(
        avatar,
        drawX,
        drawY,
        drawW,
        drawH,
      );

      ctx.restore();

      // =========================
      // BORDER
      // =========================

      ctx.save();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;

      ctx.beginPath();

      ctx.arc(
        cx,
        centerY,
        r,
        0,
        Math.PI * 2,
      );

      ctx.stroke();

      ctx.restore();

      // =========================
      // NAME
      // =========================

      ctx.save();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#ffffff";

      ctx.font =
        'bold 44px "CustomFont"';

      ctx.fillText(
        name,
        cx,
        centerY + 180,
      );

      ctx.fillStyle =
        "rgba(255,255,255,0.92)";

      ctx.font =
        '32px "CustomFont"';

      ctx.fillText(
        role,
        cx,
        centerY + 226,
      );

      ctx.restore();

      // =========================
      // OUTPUT
      // =========================

      const buffer = c.toBuffer("image/png");

      res.writeHead(200, {
        "Content-Type": "image/png",
      });

      return res.end(buffer);
    } catch (err) {
      console.error(err);

      res.json({
        status: false,
        message: err.message,
      });
    }
  },
};