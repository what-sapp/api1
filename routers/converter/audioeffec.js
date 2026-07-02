import formidable from "formidable";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import uploadToRhnx from "../../lib/scrape/cdnrhnx.js";

export default {
  path: "/api/converter/audioeffec",
  method: "POST",
  access: {
    register: false,
    apikey: true,
    limit: true,
  },
  info: [
    {
      name: "Audio Effects",
      status: "Ready",
      method: "POST",
      desc: "Ubah audio dengan berbagai efek FFmpeg",
      params: [
        {
          name: "file",
          type: "file",
          required: true,
          accept: "audio/*",
        },
        {
          name: "effect",
          type: "select",
          required: true,
          placeholder: "Pilih efek audio",
          options: [
            "bass",
            "blown",
            "deep",
            "earrape",
            "fast",
            "fat",
            "robot",
            "slow",
            "chipmunk",
            "reverb",
            "vocaloid",
            "reverse",
            "nightcore",
            "imut",
            "tupai",
            "hode",
          ],
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

          const effect = fields.effect?.[0] || fields.effect;

          const effects = {
            bass: "equalizer=f=54:width_type=o:width=2:g=20",
            blown: "acrusher=.1:1:64:0:log",
            deep: "atempo=1,asetrate=44500*2/3",
            earrape: "volume=12",
            fast: "atempo=1.63,asetrate=44100",
            fat: "atempo=1.6,asetrate=22100",
            robot:
              "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75",
            slow: "atempo=0.7,asetrate=44100",
            chipmunk: "atempo=1.5,asetrate=44100*1.5",
            reverb: "aecho=0.8:0.9:1000:0.3",
            vocaloid: "rubberband=tempo=1.2",
            reverse: "areverse",
            nightcore: "atempo=1.25,asetrate=44100*1.25",
            imut: "atempo=0.8,asetrate=62000,aresample=44100",
            tupai: "atempo=1.4,asetrate=65100,aresample=44100",
            hode: "atempo=1.2,asetrate=33000,aresample=44100",
          };

          if (!effect || !effects[effect]) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify(
                {
                  status: false,
                  message: "Effect tidak valid",
                  available: Object.keys(effects),
                },
                null,
                2,
              ),
            );
          }

          inputPath = file.filepath;

          outputPath = path.join(uploadDir, `${effect}-${Date.now()}.mp3`);

          const filter = effects[effect];

          const args = ["-i", inputPath, "-af", filter, outputPath, "-y"];

          if (effect === "robot") {
            args.splice(2, 2, "-filter_complex", filter);
          }

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

          const effectInfo = {
            bass: "Bass boost",
            blown: "Distorsi pecah",
            deep: "Suara dalam",
            earrape: "Volume ekstrem",
            fast: "Audio cepat",
            fat: "Suara gemuk",
            robot: "Suara robot",
            slow: "Audio lambat",
            chipmunk: "Suara tupai",
            reverb: "Efek gema",
            vocaloid: "Efek vocaloid",
            reverse: "Audio dibalik",
            nightcore: "Efek nightcore",
            imut: "Suara imut",
            tupai: "Suara tupai lucu",
            hode: "Suara cewek/hode",
          };

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
                  expired: "1 menit",
                  effect,
                  description: effectInfo[effect],
                  audio: {
                    original: file.originalFilename,
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
