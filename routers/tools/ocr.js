import formidable from "formidable";
import fs from "fs";
import path from "path";

const BASE = "https://imagetotext.my";
const API = `${BASE}/index.php`;

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".pdf": "application/pdf",
};

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  Referer: `${BASE}/`,
  Origin: BASE,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let cookieCache = null;

async function getCookie() {
  if (cookieCache) return cookieCache;

  const res = await fetch(BASE, {
    headers: HEADERS,
  });

  let cookies = [];

  if (typeof res.headers.getSetCookie === "function") {
    cookies = res.headers.getSetCookie();
  } else {
    const raw = res.headers.get("set-cookie");

    if (raw) {
      cookies = raw.split(/,(?=[^ ])/).map((v) => v.trim());
    }
  }

  const loginCookie = cookies
    .map((v) => v.split(";")[0])
    .find((v) => v.startsWith("login="));

  if (!loginCookie) {
    throw new Error("Gagal mengambil cookie");
  }

  cookieCache = loginCookie;

  return loginCookie;
}

async function uploadFile(filepath) {
  const cookie = await getCookie();

  const filename = path.basename(filepath);

  const ext = path.extname(filename).toLowerCase();

  const mime = MIME[ext] || "application/octet-stream";

  const buffer = fs.readFileSync(filepath);

  const boundary = `----OCR${Date.now()}`;

  const head = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="op"\r\n\r\n` +
      `upload_direct\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mime}\r\n\r\n`,
  );

  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);

  const body = Buffer.concat([head, buffer, tail]);

  const res = await fetch(API, {
    method: "POST",
    headers: {
      ...HEADERS,
      Cookie: cookie,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
  });

  const json = await res.json();

  if (!json?.success) {
    throw new Error(json?.message || "Upload OCR gagal");
  }

  return {
    fileId: String(json.data.file_id),
    key: json.data.key,
  };
}

async function pollResult(fileId, key) {
  const cookie = await getCookie();

  const params = new URLSearchParams({
    op: "status",
    action: "check_task_status",
    file_id: fileId,
    filename: key,
  });

  const start = Date.now();

  while (true) {
    if (Date.now() - start > 5 * 60 * 1000) {
      throw new Error("OCR timeout");
    }

    const res = await fetch(`${API}?${params}`, {
      headers: {
        ...HEADERS,
        Cookie: cookie,
      },
    });

    const json = await res.json();

    const data = json?.data || json || {};

    const status = String(data.status || "").toLowerCase();

    if (["completed", "complete", "done", "success"].includes(status)) {
      const result = data.result || data;

      return {
        text: result.ocr_text || result.text || "",
        confidence: result.confidence ?? null,
        language: result.language ?? null,
      };
    }

    if (status.includes("fail") || status.includes("error")) {
      throw new Error(`OCR gagal: ${status}`);
    }

    await sleep(2000);
  }
}

export default {
  path: "/api/tools/ocr",
  method: "POST",

  access: {
    register: true,
    apikey: true,
    limit: true,
  },

  info: [
    {
      name: "OCR Image To Text",
      status: "Ready",
      method: "POST",
      desc: "Extract text dari gambar atau PDF",

      params: [
        {
          name: "file",
          type: "file",
          required: true,
          accept: "image/*,.pdf",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    let uploadedPath = null;

    try {
      const uploadDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
          recursive: true,
        });
      }

      const form = formidable({
        multiples: false,
        uploadDir,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024,
      });

      form.parse(req, async (err, fields, files) => {
        try {
          if (err) throw err;

          let file = files.file;

          if (!file) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });

            return res.end(
              JSON.stringify(
                {
                  status: false,
                  message: "file wajib diupload",
                },
                null,
                2,
              ),
            );
          }

          if (Array.isArray(file)) {
            file = file[0];
          }

          uploadedPath = file.filepath;

          const { fileId, key } = await uploadFile(uploadedPath);

          const result = await pollResult(fileId, key);

          if (uploadedPath && fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }

          res.writeHead(200, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: true,
                creator: "Raihan Fadillah",

                result: {
                  fileId,
                  text: result.text,
                  confidence: result.confidence,
                  language: result.language,
                },
              },
              null,
              2,
            ),
          );
        } catch (e) {
          console.error(e);

          if (uploadedPath && fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }

          res.writeHead(500, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify(
              {
                status: false,
                message: e.message,
              },
              null,
              2,
            ),
          );
        }
      });
    } catch (e) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify(
          {
            status: false,
            message: e.message,
          },
          null,
          2,
        ),
      );
    }
  },
};
