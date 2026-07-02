import formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export default {
  path: "/api/converter/cropimg",
  method: "POST",

  access: {
    register: false,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Crop Image",
      status: "Ready",
      method: "POST",
      desc: "Crop gambar menggunakan sharp",
      params: [
        {
          name: "image",
          type: "file",
          required: true,
          accept: "image/*",
        },

        {
          name: "left",
          type: "number",
          required: true,
          placeholder: "Contoh: 100",
        },

        {
          name: "top",
          type: "number",
          required: true,
          placeholder: "Contoh: 100",
        },

        {
          name: "width",
          type: "number",
          required: true,
          placeholder: "Contoh: 300",
        },

        {
          name: "height",
          type: "number",
          required: true,
          placeholder: "Contoh: 300",
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

          let image = files.image;

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

          const left = Number(fields.left || 0);
          const top = Number(fields.top || 0);
          const width = Number(fields.width || 300);
          const height = Number(fields.height || 300);
          const imagePath = image.filepath;

          const output = path.join(uploadDir, `crop_${Date.now()}.jpg`);

          await sharp(imagePath)
            .extract({
              left,
              top,
              width,
              height,
            })
            .toFile(output);

          const buffer = fs.readFileSync(output);

          res.writeHead(200, {
            "Content-Type": "image/jpeg",
            "x-left": String(left),
            "x-top": String(top),
            "x-width": String(width),
            "x-height": String(height),
          });

          res.end(buffer);

          fs.unlink(imagePath, () => {});
          fs.unlink(output, () => {});
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
