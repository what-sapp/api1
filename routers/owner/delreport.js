import fs from "fs";
import path from "path";

export default {
  path: "/api/admin/delreport",

  method: "POST",

  access: {
    register: true,
    apikey: true,
    admin: true,
  },

  info: [
    {
      name: "Delreport",

      status: "Ready",

      method: "POST",

      desc:
        "Menghapus satu report berdasarkan ID atau clear semua report",

      params: [
        {
          name: "type",

          type: "select",

          required: true,

          options: [
            {
              label: "Delete One",
              value: "one",
            },

            {
              label: "Clear All",
              value: "all",
            },
          ],
        },

        {
          name: "id",

          type: "string",

          required: false,

          placeholder:
            "RPT-xxxxxx",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }

        const reportPath = path.join(
          process.cwd(),
          "database",
          "report.json",
        );

        // bikin file kalau belum ada
        if (
          !fs.existsSync(reportPath)
        ) {
          fs.writeFileSync(
            reportPath,
            "[]",
          );
        }

        let reports = [];

        try {
          reports = JSON.parse(
            fs.readFileSync(
              reportPath,
              "utf8",
            ),
          );

          if (
            !Array.isArray(
              reports,
            )
          ) {
            reports = [];
          }
        } catch {
          reports = [];
        }

        // =====================
        // CLEAR ALL
        // =====================
        if (
          body.type === "all"
        ) {
          fs.writeFileSync(
            reportPath,
            "[]",
          );

          res.writeHead(200, {
            "Content-Type":
              "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: true,

                message:
                  "Semua report berhasil dihapus",
              },
              null,
              2,
            ),
          );
        }

        // =====================
        // DELETE ONE
        // =====================
        if (
          body.type === "one"
        ) {
          if (!body.id) {
            res.writeHead(400, {
              "Content-Type":
                "application/json",
            });

            return res.end(
              JSON.stringify(
                {
                  status: false,

                  message:
                    "ID report diperlukan",
                },
                null,
                2,
              ),
            );
          }

          const index =
            reports.findIndex(
              (r) =>
                r.id === body.id,
            );

          if (index < 0) {
            res.writeHead(404, {
              "Content-Type":
                "application/json",
            });

            return res.end(
              JSON.stringify(
                {
                  status: false,

                  message:
                    "Report tidak ditemukan",
                },
                null,
                2,
              ),
            );
          }

          const deleted =
            reports.splice(
              index,
              1,
            )[0];

          fs.writeFileSync(
            reportPath,
            JSON.stringify(
              reports,
              null,
              2,
            ),
          );

          res.writeHead(200, {
            "Content-Type":
              "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: true,

                message:
                  "Report berhasil dihapus",

                deleted,
              },
              null,
              2,
            ),
          );
        }

        // =====================
        // INVALID TYPE
        // =====================
        res.writeHead(400, {
          "Content-Type":
            "application/json",
        });

        return res.end(
          JSON.stringify(
            {
              status: false,

              message:
                "Type tidak valid",
            },
            null,
            2,
          ),
        );
      });
    } catch (err) {
      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify(
          {
            status: false,

            message:
              "Terjadi kesalahan",

            error:
              err.message,
          },
          null,
          2,
        ),
      );
    }
  },
};