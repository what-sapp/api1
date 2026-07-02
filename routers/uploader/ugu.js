import formidable from "formidable";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

export default {
  path: "/api/uploader/uguu",
  method: "POST",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Uguu",
      status: "Ready",
      method: "POST",
      desc: "Upload file ke uguu.se",
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
        formData.append("files[]", fs.createReadStream(filePath));

        const r = await fetch("https://uguu.se/upload.php", {
          method: "POST",
          body: formData,
          headers: formData.getHeaders(),
        });

        const json = await r.json();

        fs.unlinkSync(filePath);

        return res.end(JSON.stringify({
          status: true,
          provider: "uguu",
          url: json.files?.[0]?.url,
          expires: "3–7 days"
        }, null, 2));

      } catch (e) {
        return res.end(JSON.stringify({
          status: false,
          provider: "uguu",
          message: e.message
        }));
      }
    });
  },
};