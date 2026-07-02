import formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export default {
  path: "/api/tools/blurimg",
  method: "POST",

  access: {
    register: false,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Blur Image",
      status: "Ready",
      method: "POST",
      desc: "Blur gambar menggunakan sharp",
      params: [
        {
          name: "image",
          type: "file",
          required: true,
          accept: "image/*",
        },
        {
          name: "blur",
          type: "number",
          required: false,
          placeholder: "Contoh: 10",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const uploadDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const form = formidable({
        multiples: false,
        uploadDir,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024,
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ status: false, message: err.message }));
        }

        let blur = Number(fields.blur || 10);
        let image = files.image;

        if (Array.isArray(image)) image = image[0];

        if (!image) {
          res.writeHead(400);
          return res.end(JSON.stringify({
            status: false,
            message: "Image wajib diupload",
          }));
        }

        const imagePath = image.filepath;

        try {
          // 🔥 langsung buffer (NO FILE OUTPUT)
          const outputBuffer = await sharp(imagePath)
            .blur(blur)
            .toBuffer();

          res.writeHead(200, {
            "Content-Type": image.mimetype || "image/jpeg",
          });

          res.end(outputBuffer);

        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({
            status: false,
            message: e.message,
          }));
        } finally {
          fs.unlink(imagePath, () => {});
        }
      });

    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({
        status: false,
        message: e.message,
      }));
    }
  },
};