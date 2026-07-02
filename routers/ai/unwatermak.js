import formidable from "formidable";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";

async function createJob(imgPath, productSerial) {
  const form = new FormData();

  form.append("original_image_file", fs.createReadStream(imgPath), {
    filename: path.basename(imgPath),
  });

  form.append("output_format", "jpg");
  form.append("is_remove_text", "true");
  form.append("is_remove_logo", "true");
  form.append("is_enhancer", "true");

  const r = await axios.post(
    "https://api.unwatermark.ai/api/web/v1/image-watermark-auto-remove-upgrade/create-job",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "Product-Serial": productSerial,
        "Product-Code": "067003",
        origin: "https://unwatermark.ai",
        referer: "https://unwatermark.ai/",
      },
    },
  );

  return r.data.result.job_id;
}

async function getJob(jobId, productSerial) {
  const r = await axios.get(
    `https://api.unwatermark.ai/api/web/v1/image-watermark-auto-remove-upgrade/get-job/${jobId}`,
    {
      headers: {
        "Product-Serial": productSerial,
        "Product-Code": "067003",
        origin: "https://unwatermark.ai",
        referer: "https://unwatermark.ai/",
      },
    },
  );

  return r.data;
}

async function unwatermark(imgPath) {
  const productSerial = crypto.randomUUID();
  const jobId = await createJob(imgPath, productSerial);

  while (true) {
    await new Promise((r) => setTimeout(r, 3000));
    const s = await getJob(jobId, productSerial);

    if (s.code === 100000 && s.result?.output_url) {
      return {
        job_id: jobId,
        input_url: s.result.input_url,
        output_url: Array.isArray(s.result.output_url)
          ? s.result.output_url[0]
          : s.result.output_url,
      };
    }
  }
}

export default {
  path: "/api/ai/unwatermark",
  method: "POST",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Remove Watermark Image",
      status: "Ready",
      method: "POST",
      desc: "Upload gambar untuk menghapus watermark otomatis",

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
    try {
      const uploadDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const form = formidable({
        multiples: false,
        maxFileSize: 50 * 1024 * 1024,
        uploadDir: uploadDir,
        keepExtensions: true,
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: false,
              message: err.message,
            }),
          );
        }

        let imageFile = files.image;

        if (!imageFile) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: false,
              message: "image wajib diupload",
            }),
          );
        }

        if (Array.isArray(imageFile)) {
          imageFile = imageFile[0];
        }

        if (!imageFile.filepath) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: false,
              message: "filepath tidak ditemukan",
            }),
          );
        }

        try {
          const result = await unwatermark(imageFile.filepath);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(
              {
                status: true,
                message: "Watermark berhasil dihapus",
                result,
              },
              null,
              2,
            ),
          );

          fs.unlink(imageFile.filepath, () => {});
        } catch (apiError) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: false,
              message: apiError.message,
            }),
          );
        }
      });
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: e.message,
        }),
      );
    }
  },
};
