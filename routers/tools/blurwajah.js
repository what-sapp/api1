import { faceBlur } from "../../lib/scrape/blurwajah.js";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export default {
  path: "/api/ai/blurwajah",
  method: "POST",

  access: {
    register: false,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "blurwajah",
      status: "Ready",
      method: "POST",
      desc: "Blur wajah AI langsung return image",
      params: [
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
      if (Array.isArray(image)) image = image[0];

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

      try {
        const result = await faceBlur(imagePath);

        if (!result.status || !result.output) {
          res.writeHead(500, {
            "Content-Type": "application/json",
          });
          return res.end(JSON.stringify(result));
        }

        const buffer = fs.readFileSync(result.output);

        res.writeHead(200, {
          "Content-Type": "image/png",
        });

        return res.end(buffer);
      } catch (e) {
        res.writeHead(500, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify({
            status: false,
            message: e.message,
          }),
        );
      } finally {
        fs.unlink(imagePath, () => {});
      }
    });
  },
};
