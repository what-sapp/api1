import fs from "fs";
import path from "path";

export default {
  path: "/api/settings/cleartmp",
  method: "POST",
  access : {
      register:true,
      admin:true,
      apikey:true,
  },
  info: [
    {
      name: "Delete Sampah",
      status: "Ready",
      method: "POST",
      desc: "Menghapus semua file di folder tmp",

      params: [],
    },
  ],

  execution: async (req, res) => {
    try {
      const tmpDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(tmpDir)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Folder tmp tidak ditemukan",
          }),
        );
      }

      const files = fs.readdirSync(tmpDir);

      let deleted = 0;

      for (const file of files) {
        const filePath = path.join(tmpDir, file);

        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            message: "TMP berhasil dibersihkan",
            deletedFiles: deleted,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: err.message,
        }),
      );
    }
  },
};
