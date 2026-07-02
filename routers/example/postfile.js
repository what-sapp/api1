import formidable from "formidable";
import fs from "fs";
import path from "path";

export default {
  path: "/api/example/upload",
  method: "POST",

  info: [
    {
      name: "Upload File Test",
      status: "Ready",
      method: "POST",
      desc: "Endpoint untuk test upload file via playground",

      params: [
        {
          name: "text",
          type: "text",
          required: false,
          placeholder: "isi text bebas",
        },
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

        const text = fields.text || null;
        let uploadedFile = files.file;

        if (!uploadedFile) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: false,
              message: "file wajib diupload",
            }),
          );
        }

        // 🔥 Kalau array (Formidable v3)
        if (Array.isArray(uploadedFile)) {
          uploadedFile = uploadedFile[0];
        }

        // 🔥 Cek filepath aman
        if (!uploadedFile.filepath) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: false,
              message: "filepath tidak ditemukan",
              debug: uploadedFile,
            }),
          );
        }

        const fileInfo = {
          originalName: uploadedFile.originalFilename,
          savedAs: path.basename(uploadedFile.filepath),
          fullPath: uploadedFile.filepath,
          size: uploadedFile.size,
          type: uploadedFile.mimetype,
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            {
              status: true,
              message: "Upload berhasil & file disimpan di folder tmp",
              received: {
                text,
                file: fileInfo,
              },
            },
            null,
            2,
          ),
        );
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
