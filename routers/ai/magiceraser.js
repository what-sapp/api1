import formidable from "formidable";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

function genserial() {
  let s = "";
  for (let i = 0; i < 32; i++) {
    s += Math.floor(Math.random() * 16).toString(16);
  }
  return s;
}

async function upimage(filename) {
  const form = new FormData();
  form.append("file_name", filename);

  const res = await axios.post(
    "https://api.imgupscaler.ai/api/common/upload/upload-image",
    form,
    {
      headers: {
        ...form.getHeaders(),
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/",
      },
    },
  );

  return res.data.result;
}

async function uploadtoOSS(putUrl, filePath) {
  const file = fs.readFileSync(filePath);
  const type =
    path.extname(filePath).toLowerCase() === ".png"
      ? "image/png"
      : "image/jpeg";

  const res = await axios.put(putUrl, file, {
    headers: {
      "Content-Type": type,
      "Content-Length": file.length,
    },
    maxBodyLength: Infinity,
  });

  return res.status === 200;
}

async function createJob(imageUrl, prompt) {
  const form = new FormData();
  form.append("model_name", "magiceraser_v4");
  form.append("original_image_url", imageUrl);
  form.append("prompt", prompt);
  form.append("ratio", "match_input_image");
  form.append("output_format", "jpg");

  const res = await axios.post(
    "https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "product-code": "magiceraser",
        "product-serial": genserial(),
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/",
      },
    },
  );

  return res.data.result.job_id;
}

async function cekjob(jobId) {
  const res = await axios.get(
    `https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`,
    {
      headers: {
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/",
      },
    },
  );

  return res.data;
}

async function magicEraser(imagePath, prompt) {
  const filename = path.basename(imagePath);

  const uploadInfo = await upimage(filename);
  await uploadtoOSS(uploadInfo.url, imagePath);

  const cdn = "https://cdn.imgupscaler.ai/" + uploadInfo.object_name;
  const jobId = await createJob(cdn, prompt);

  let result;
  let attempts = 0;

  do {
    await new Promise((r) => setTimeout(r, 3000));
    result = await cekjob(jobId);
    attempts++;
    if (attempts > 20) throw new Error("Timeout processing image");
  } while (result.code === 300006);

  return {
    job_id: jobId,
    image: result.result.output_url[0],
  };
}

export default {
  path: "/api/ai/magiceraser",
  method: "POST",
  access: {
    register: false,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Magic Eraser",
      status: "Ready",
      method: "POST",
      desc: "Edit gambar dengan AI berdasarkan prompt",

      params: [
        {
          name: "name",
          type: "string",
          required: true,
          placeholder: "Contoh: ubah agar dia tersenyum",
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
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ success: false, message: err.message }),
          );
        }

        let prompt = fields.name;

        if (Array.isArray(prompt)) {
          prompt = prompt[0];
        }
        let imageFile = files.image;

        if (!prompt) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: false,
              alasan: "Parameter name (prompt) wajib diisi",
            }),
          );
        }

        if (!imageFile) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: false,
              alasan: "Image wajib diupload",
            }),
          );
        }

        if (Array.isArray(imageFile)) {
          imageFile = imageFile[0];
        }

        try {
          const result = await magicEraser(imageFile.filepath, prompt);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(
              {
                status: true,
                creator: "Raihan Fadillah",
                alasan: "Image berhasil diproses AI",
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
              alasan: apiError.message,
            }),
          );
        }
      });
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          alasan: e.message,
        }),
      );
    }
  },
};
