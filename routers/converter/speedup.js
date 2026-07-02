// api/converter/speedup.js

import formidable from "formidable";
import fs from "fs";
import path from "path";

import { spawn } from "child_process";

import uploadToRhnx from "../../lib/scrape/cdnrhnx.js";

export default {
  path: "/api/converter/speedup",
  method: "POST",

  access: {
    register: false,
  },

  info: [
    {
      name: "Speed Up Audio",
      status: "Ready",
      method: "POST",

      desc: "Mempercepat audio dan menaikkan pitch",

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
        let inputPath = null;
        let outputPath = null;

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

          inputPath = file.filepath;

          outputPath = path.join(uploadDir, `speedup-${Date.now()}.mp3`);

          const filter = "atempo=1.1,asetrate=65100";

          const args = ["-i", inputPath, "-filter:a", filter, outputPath, "-y"];

          console.log("FFMPEG:", args.join(" "));
        
          await new Promise((resolve, reject) => {
            const ffmpeg = spawn("ffmpeg", args);

            let logs = "";

            ffmpeg.stdout.on("data", (d) => {
              logs += d.toString();
            });

            ffmpeg.stderr.on("data", (d) => {
              logs += d.toString();
            });

            ffmpeg.on("close", (code) => {
              console.log(logs);

              if (code !== 0) {
                return reject(new Error(`FFmpeg gagal dengan code ${code}`));
              }

              resolve(true);
            });

            ffmpeg.on("error", (e) => {
              reject(e);
            });
          });

          if (!fs.existsSync(outputPath)) {
            throw new Error("Output audio gagal dibuat");
          }

          const upload = await uploadToRhnx(outputPath);

          if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }

          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
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
                creator: "Rangel",

                result: {
                  url: upload.url,
                  expired: "1 menit",
                  effect: "speed-up",
                  audio: {
                    original: file.originalFilename,
                    mimetype: file.mimetype,
                    size: file.size,
                  },

                  settings: {
                    atempo: "1.1x",
                    asetrate: "65100Hz",
                  },
                },
              },
              null,
              2,
            ),
          );
        } catch (e) {
          console.error(e);

          if (inputPath && fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }

          if (outputPath && fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
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
