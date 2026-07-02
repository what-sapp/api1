import { createCanvas } from "canvas";

export default {
  path: "/api/tools/captcha",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Captcha",
      status: "Ready",
      method: "GET",
      desc: "Real captcha image (chaotic, thin text, anti OCR)",
      params: [
        { name: "width", type: "number", placeholder: "200" },
        { name: "height", type: "number", placeholder: "80" },
        { name: "length", type: "number", placeholder: "5" },
        { name: "hard", type: "boolean", placeholder: "false" },
        { name: "text", type: "string", placeholder: "ABCDE (optional)" },
      ],
    },
  ],

  execution: (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const width = Math.min(Number(url.searchParams.get("width")) || 200, 400);
    const height = Math.min(Number(url.searchParams.get("height")) || 80, 200);
    const length = Math.min(Number(url.searchParams.get("length")) || 5, 8);
    const hard = url.searchParams.get("hard") === "true";
    const customText = url.searchParams.get("text"); 
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let text = "";

    if (customText) {
    
      text = customText
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);
    } else {
    
      for (let i = 0; i < length; i++) {
        text += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const lineCount = hard ? 14 : 8;
    const dotCount = hard ? 220 : 120;
    const curveCount = hard ? 6 : 3;

    // garis
    for (let i = 0; i < lineCount; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.35})`;
      ctx.lineWidth = Math.random() * 1.2;
      ctx.stroke();
    }

    // titik
    for (let i = 0; i < dotCount; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // curve
    for (let i = 0; i < curveCount; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
      ctx.lineWidth = Math.random() * 1.5;
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.quadraticCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.stroke();
    }

    const baseFontSize = Math.floor(height * 0.48);
    const spacing = width / (text.length + 1);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      const fontSize = baseFontSize + Math.random() * 6 - 3;
      const rotate = (Math.random() - 0.5) * (hard ? 0.9 : 0.5);

      const x =
        spacing * (i + 1) + Math.random() * (hard ? 12 : 8) - 4;
      const y =
        height / 2 + Math.random() * (hard ? 16 : 10) - 5;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotate);

      ctx.font = `${fontSize}px sans-serif`;

      const gray = Math.floor(70 + Math.random() * 110);
      ctx.fillStyle = `rgba(${gray},${gray},${gray},0.8)`;

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";

      ctx.fillText(char, 0, 0);
      ctx.strokeText(char, 0, 0);

      ctx.restore();
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const amplitude = hard ? 7 : 4;
    const frequency = hard ? 0.09 : 0.05;

    for (let y = 0; y < height; y++) {
      const shift = Math.sin(y * frequency) * amplitude;
      for (let x = 0; x < width; x++) {
        const srcX = Math.floor(x + shift);
        if (srcX >= 0 && srcX < width) {
          const src = (y * width + srcX) * 4;
          const dst = (y * width + x) * 4;

          data[dst] = data[src];
          data[dst + 1] = data[src + 1];
          data[dst + 2] = data[src + 2];
          data[dst + 3] = data[src + 3];
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const buffer = canvas.toBuffer("image/png");

    res.writeHead(200, {
      "Content-Type": "image/png",
      "X-Captcha-Text": text, 
      "Content-Length": buffer.length,
    });

    res.end(buffer);
  },
};