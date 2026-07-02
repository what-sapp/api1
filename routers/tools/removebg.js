import axios from "axios";
import FormData from "form-data";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import uploadToRhnx from "../../lib/scrape/cdnrhnx.js";

async function removeBg(buffer, mime = "image/jpeg") {
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    Origin: "https://www.pixelcut.ai",
    Referer: "https://www.pixelcut.ai/",

    "Sec-Ch-Ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?1",
    "Sec-Ch-Ua-Platform": '"Android"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
    "X-Client-Version": "web:pixelcut.ai:b98bfd12",
    "X-Locale": "en",
  };

  const form = new FormData();

  form.append("image", buffer, {
    filename: "image.jpg",
    contentType: mime,
  });

  form.append("format", "png");
  form.append("model", "v1");

  const { data } = await axios.post(
    "https://api2.pixelcut.app/image/matte/v1",
    form,
    {
      headers: {
        ...headers,
        ...form.getHeaders(),
      },

      responseType: "arraybuffer",
    },
  );

  return Buffer.from(data);
}

export default {
  path: "/api/tools/removebg",
  method: "POST",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Removebg",
      status: "Ready",
      method: "POST",
      desc: "Menghapus background gambar",
      params: [
        {
          name: "file",
          type: "file",
          required: true,
          accept: "image/*",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    let filepath = null;
    let outputPath = null;

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

        maxFileSize: 20 * 1024 * 1024,
      });

      form.parse(req, async (err, fields, files) => {
        try {
          if (err) {
            throw new Error(err.message);
          }

          let uploaded = files.file;

          if (!uploaded) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify(
                {
                  status: false,
                  message: "File wajib diupload",
                },
                null,
                2,
              ),
            );
          }

          if (Array.isArray(uploaded)) {
            uploaded = uploaded[0];
          }

          filepath = uploaded.filepath;

          if (!uploaded.mimetype?.startsWith("image/")) {
            throw new Error("File harus gambar");
          }

          const buffer = fs.readFileSync(filepath);
          const result = await removeBg(buffer, uploaded.mimetype);

          outputPath = path.join(uploadDir, `removebg-${Date.now()}.png`);

          fs.writeFileSync(outputPath, result);

          const upload = await uploadToRhnx(outputPath);

          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
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
                creator: "Raihan Fadillah",
                result: {
                  url: upload.url,
                  expired: upload.expired || "1 menit",
                  file: {
                    filename: uploaded.originalFilename,
                    mimetype: "image/png",
                    size: result.length,
                  },
                },
              },
              null,
              2,
            ),
          );
        } catch (e) {
          console.error(e);
          try {
            if (filepath && fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }

            if (outputPath && fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
          } catch {}

          res.writeHead(500, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: false,
                message: e.response?.data?.toString?.() || e.message,
              },
              null,
              2,
            ),
          );
        }
      });
    } catch (e) {
      console.error(e);

      try {
        if (filepath && fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }

        if (outputPath && fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      } catch {}

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
