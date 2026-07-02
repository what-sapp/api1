import fs from "fs";
import path from "path";

export default {
  path: "/api/admin/listreport",

  method: "GET",

  access: {
    register: true,
    apikey: true,
    admin: true,
  },

  info: [
    {
      name: "List Report",

      status: "Ready",

      method: "GET",

      desc: "Menampilkan semua report endpoint dari database",

      params: [],
    },
  ],

  execution: async (req, res) => {
    try {
      const reportPath = path.join(
        process.cwd(),
        "database",
        "report.json",
      );

      // bikin file kalau belum ada
      if (!fs.existsSync(reportPath)) {
        fs.writeFileSync(
          reportPath,
          "[]",
        );
      }

      const raw = fs.readFileSync(
        reportPath,
        "utf-8",
      );

      let reports = [];

      try {
        reports = JSON.parse(raw);

        if (
          !Array.isArray(reports)
        ) {
          reports = [];
        }
      } catch {
        reports = [];
      }

      res.writeHead(200, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify(
          {
            status: true,

            total:
              reports.length,

            reports,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          status: false,

          message:
            "Gagal mengambil data report",

          error: err.message,
        }),
      );
    }
  },
};