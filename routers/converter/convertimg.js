import formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export default {
  path: "/api/converter/convert",

  method: "POST",

  access: {
    register: false,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Convert",
      status: "Ready",
      method: "POST",
      desc: "Convert gambar ke format lain",
      params: [
        {
          name: "format",
          type: "string",
          required: true,
          placeholder: "jpg/png/webp/avif/gif/tiff",
        },

        {
          name: "image",
          type: "file",
          required: true,
          accept: "image/*",
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

          let format = fields.format;
          let image = files.image;

          if (Array.isArray(format)) {
            format = format[0];
          }

          if (Array.isArray(image)) {
            image = image[0];
          }

          if (!format) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify({
                status: false,

                message: "Format wajib diisi",
              }),
            );
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

          format = format.toLowerCase();

          const output = path.join(
            uploadDir,
            `converted-${Date.now()}.${format}`,
          );

          let convert = sharp(image.filepath);

          switch (format) {
            case "jpg":
            case "jpeg":
              convert = convert.jpeg({
                quality: 80,
              });
              break;

            case "png":
              convert = convert.png({
                quality: 80,
              });
              break;

            case "webp":
              convert = convert.webp({
                quality: 80,
              });
              break;

            case "avif":
              convert = convert.avif({
                quality: 80,
              });
              break;

            case "gif":
              convert = convert.gif();
              break;

            case "tiff":
              convert = convert.tiff({
                quality: 80,
              });
              break;

            default:
              throw new Error("Format tidak didukung");
          }

          await convert.toFile(output);

          const buffer = fs.readFileSync(output);

          let mime = "image/jpeg";

          if (format === "png") mime = "image/png";
          if (format === "webp") mime = "image/webp";
          if (format === "avif") mime = "image/avif";
          if (format === "gif") mime = "image/gif";
          if (format === "tiff") mime = "image/tiff";

          res.writeHead(200, {
            "Content-Type": mime,

            "Content-Disposition": `inline; filename="converted.${format}"`,
          });

          res.end(buffer);

          fs.unlink(image.filepath, () => {});
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
