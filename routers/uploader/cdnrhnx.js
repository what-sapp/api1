import formidable from "formidable";
import fs from "fs";
import path from "path";

import uploadToRhnx from "../../lib/scrape/cdnrhnx.js";

export default {
  path: "/api/uploader/cdnrhnx",
  method: "POST",

  access: {
    register: false,
  },

  info: [
    {
      name: "cdnrhnx",
      status: "Ready",
      method: "POST",

      desc: "Upload file ke CDN RHNX",

      access: {
        register: true,
        limit: true,
        apikey: true,
      },

      params: [
        {
          name: "file",
          type: "file",
          required: true,
          accept: "*/*",
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
        maxFileSize: 100 * 1024 * 1024,
      });

      form.parse(req, async (err, fields, files) => {
        let filepath = null;

        try {
          if (err) {
            throw new Error(err.message);
          }

          let file = files.file;
          if (!file) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify(
                {
                  status: false,
                  message: "file wajib diupload",
                },
                null,
                2,
              ),
            );
          }

          if (Array.isArray(file)) {
            file = file[0];
          }

          if (!file.filepath) {
            throw new Error("filepath tidak ditemukan");
          }

          filepath = file.filepath;

          const upload = await uploadToRhnx(filepath);

          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }

          if (!upload.status) {
            throw new Error(upload.message || "Upload CDN gagal");
          }

          res.writeHead(200, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: true,
                creator: "Raihan Fadillah",
                result: {
                  url: upload.url,
                  expired: upload.expired || "1 menit",
                  file: {
                    filename: file.originalFilename,
                    mimetype: file.mimetype,
                    size: file.size,
                  },
                },
              },
              null,
              2,
            ),
          );
        } catch (e) {
          console.error(e);
          if (filepath && fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }

          res.writeHead(500, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: false,
                message: e.message,
              },
              null,
              2,
            ),
          );
        }
      });
    } catch (e) {
      console.error(e);

      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: false,
            message: e.message,
          },
          null,
          2,
        ),
      );
    }
  },
};
