import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

export default {
  path: "/api/ai/human",
  method: "POST",

  info: [
    {
      name: "Human AI Detection",
      status: "Ready",
      method: "POST",
      desc: "Deteksi wajah, tangan, tubuh, kaki menggunakan Human AI",

      params: [
        {
          name: "image",
          type: "file",
          required: true,
          accept: "image/*",
        },
        {
          name: "mode",
          type: "select",
          required: true,
          options: ["face", "hand", "body", "leg", "auto"],
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const formParser = formidable({
        multiples: false,
        keepExtensions: true,
      });

      formParser.parse(req, async (err, fields, files) => {
        try {
          if (err) {
            return res.writeHead(500).end(
              JSON.stringify({
                status: false,
                message: err.message,
              }),
            );
          }
            
          let image = files.image;

          if (Array.isArray(image)) {
            image = image[0];
          }

          if (!image || !image.filepath) {
            return res.writeHead(400).end(
              JSON.stringify({
                status: false,
                message: "Image wajib diupload",
              }),
            );
          }
          let mode = fields.mode;

          if (Array.isArray(mode)) {
            mode = mode[0];
          }

          mode = mode || "auto";
          const form = new FormData();

          form.append(
            "image",
            fs.createReadStream(image.filepath),
          );

          form.append("mode", String(mode));

          const api = await fetch(
            "https://human.rhnx.xyz/api/upload",
            {
              method: "POST",
              body: form,
              headers: form.getHeaders(),
            },
          );

          const data = await api.json();

          return res.writeHead(200, {
            "Content-Type": "application/json",
          }).end(
            JSON.stringify(
              {
                status: true,
                creator:'Raihan Fadillah',
                mode,
                result: data.result || null,
              },
              null,
              2,
            ),
          );
        } catch (e) {
          return res.writeHead(500).end(
            JSON.stringify({
              status: false,
              message: e.message,
            }),
          );
        }
      });
    } catch (e) {
      res.writeHead(500).end(
        JSON.stringify({
          status: false,
          message: e.message,
        }),
      );
    }
  },
};