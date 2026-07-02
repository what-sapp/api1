import formidable from "formidable";
import fs from "fs";
import path from "path";

import { audioToText } from "../../lib/scrape/audiototext.js";

export default {
  path: "/api/converter/audiototext",
  method: "POST",

  info: [
    {
      name: "Audio To Text",
      status: "Ready",
      method: "POST",
      desc: "Convert audio menjadi text",

      params: [
        {
          name: "file",
          type: "file",
          required: true,
          accept: "audio/*",
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

          let uploadedFile = files.file;

          if (!uploadedFile) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify({
                status: false,
                message: "file wajib diupload",
              }),
            );
          }

          if (Array.isArray(uploadedFile)) {
            uploadedFile = uploadedFile[0];
          }

          if (!uploadedFile.filepath) {
            res.writeHead(500, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify({
                status: false,
                message: "filepath tidak ditemukan",
              }),
            );
          }

          const result = await audioToText(uploadedFile.filepath);

          res.writeHead(200, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify(
              {
                status: true,
                creator: "Raihan Fadillah",
                result,
              },
              null,
              2,
            ),
          );
        } catch (e) {
          res.writeHead(500, {
            "Content-Type": "application/json",
          });

          res.end(
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
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
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
