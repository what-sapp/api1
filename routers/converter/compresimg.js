import formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export default {
  path: "/api/converter/compressimg",
  method: "POST",
  access: {
    register: false,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Compress Image",
      status: "Ready",
      method: "POST",
      desc: "Compress gambar",
      params: [
        {
          name: "image",
          type: "file",
          required: true,
          accept: "image/*",
        },

        {
          name: "quality",
          type: "number",
          required: false,
          placeholder: "Contoh: 50",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const uploadDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
          recursive: true,
        });
      }

      const form = formidable({
        multiples: false,
        uploadDir,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024,
      });

      form.parse(req, async (err, fields, files) => {
        try {
          if (err) {
            res.writeHead(500, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify({
                status: false,
                message: err.message,
              }),
            );
          }

          let quality = fields.quality || 50;
          let image = files.image;

          if (Array.isArray(quality)) {
            quality = quality[0];
          }

          if (Array.isArray(image)) {
            image = image[0];
          }

          if (!image) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify({
                status: false,
                message: "Image wajib diupload",
              }),
            );
          }

          const imagePath = image.filepath;

          const inputBuffer = fs.readFileSync(imagePath);

          const outputBuffer = await sharp(inputBuffer)
            .jpeg({
              quality: Number(quality),
            })
            .toBuffer();

          const before = fs.statSync(imagePath).size;

          const after = outputBuffer.length;

          res.writeHead(200, {
            "Content-Type": "image/jpeg",

            "x-before-size": `${(before / 1024).toFixed(2)} KB`,

            "x-after-size": `${(after / 1024).toFixed(2)} KB`,

            "x-quality": String(quality),
          });

          res.end(outputBuffer);

          fs.unlink(imagePath, () => {});
        } catch (e) {
          res.writeHead(500, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              status: false,
              message: e.message,
            }),
          );
        }
      });
    } catch (e) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          status: false,
          message: e.message,
        }),
      );
    }
  },
};
