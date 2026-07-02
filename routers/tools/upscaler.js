import formidable from "formidable";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

async function imageUpscaler(filePath) {
  try {
    const res = await fetch("https://www.iloveimg.com/id/tingkatkan-gambar", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await res.text();

    const token = html.match(/"token":"([^"]+)"/)?.[1];
    const taskId = html.match(/ilovepdfConfig\.taskId\s*=\s*'([^']+)'/)?.[1];

    if (!token || !taskId) {
      throw new Error("Gagal ambil token/taskId");
    }

    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    const form = new FormData();
    form.append("name", fileName);
    form.append("chunk", "0");
    form.append("chunks", "1");
    form.append("task", taskId);
    form.append("preview", "1");
    form.append("pdfinfo", "0");
    form.append("pdfforms", "0");
    form.append("pdfresetforms", "0");
    form.append("v", "web.0");
    form.append("file", new Blob([fileBuffer]), fileName);

    const uploadRes = await fetch("https://api1g.iloveimg.com/v1/upload", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const uploadData = await uploadRes.json();

    const processForm = new FormData();
    processForm.append("packaged_filename", "upscaled-image");
    processForm.append("multiplier", "2");
    processForm.append("task", taskId);
    processForm.append("tool", "upscaleimage");
    processForm.append("files[0][server_filename]", uploadData.server_filename);
    processForm.append("files[0][filename]", fileName);

    const processRes = await fetch("https://api1g.iloveimg.com/v1/process", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: "https://www.iloveimg.com",
      },
      body: processForm,
    });

    const processData = await processRes.json();

    if (processData.status !== "TaskSuccess") {
      throw new Error("Processing failed");
    }

    return {
      status: true,
      creator: "Raihan Fadilah",
      downloadUrl: `https://api1g.iloveimg.com/v1/download/${taskId}`,
      filename: processData.download_filename,
      filesize: processData.output_fiesize,
      extensions: processData.output_extensions,
      timer: processData.timer,
    };
  } catch (err) {
    return { status: false, error: err.message };
  }
}



export default {
  path: "/api/tools/upscale",
  method: "POST",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },
  info: [
    {
      name: "Image Upscaler",
      status: "Ready",
      method: "POST",
      desc: "Upscale gambar 2x menggunakan iloveimg",
      params: [
        { name: "file", type: "file", required: true, accept: "image/*" },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const uploadDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const form = formidable({ uploadDir, keepExtensions: true, multiples: false });

      // Gunakan promise untuk meng-handle formidable supaya bisa await
      const { files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      let uploadedFile = files.file;
      if (Array.isArray(uploadedFile)) uploadedFile = uploadedFile[0];

      if (!uploadedFile) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "File wajib diupload" }));
      }

      const result = await imageUpscaler(uploadedFile.filepath);

      // Hapus file sementara
      fs.unlink(uploadedFile.filepath, () => {});

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result, null, 2));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
  },
};