import formidable from "formidable";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

export default {
  path: "/api/uploader/tmpfiles",
  method: "POST",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Tmpfiles",
      status: "Ready",
      method: "POST",
      desc: "Upload file ke tmpfiles.org",
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
    const uploadDir = path.join(process.cwd(), "tmp");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      try {
        if (err) throw err;

        let file = files.file;
        if (Array.isArray(file)) file = file[0];

        const filePath = file.filepath;

        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        const r = await fetch("https://tmpfiles.org/api/v1/upload", {
          method: "POST",
          body: formData,
          headers: formData.getHeaders(),
        });

        const json = await r.json();

        fs.unlinkSync(filePath);

        return res.end(JSON.stringify({
          status: true,
          provider: "tmpfiles",
          url: json.data?.url,
          expires: "1–7 days"
        }, null, 2));

      } catch (e) {
        return res.end(JSON.stringify({
          status: false,
          provider: "tmpfiles",
          message: e.message
        }));
      }
    });
  },
};