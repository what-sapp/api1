import mql from "@microlink/mql";

const DEFAULT_CONFIG = {
  bg: "rgba(226,233,239,1)",
  t: "dracula-pro",
  wt: "none",
  l: "auto",
  ds: "false",
  dsyoff: "20px",
  dsblur: "68px",
  wc: "true",
  wa: "true",
  pv: "56px",
  ph: "56px",
  ln: "true",
  fl: "1",
  fm: "Fira Code",
  fs: "14px",
  lh: "152%",
  si: "false",
  es: "2x",
  wm: "false",
};

const pick = (v, d) => (v === undefined || v === null || v === "" ? d : v);

export default {
  path: "/api/tools/carbon",
  method: "POST",

  access: {
    register: true,
    apikey:true,
    limit:true,
  },
    
 info: [
  {
    name: "Carbon Code Image",
    status: "Ready",
    method: "POST",
    desc: "Generate gambar Carbon (cukup isi code saja)",

    params: [
      {
        name: "code",
        input: "textarea",
        required: true,
        placeholder: "Tempel kode kamu di sini...",
      },

      {
        name: "theme",
        type: "select",
        options: [
          "dracula-pro",
          "seti",
          "one-light",
          "one-dark",
          "night-owl",
          "nord",
          "monokai",
          "material",
          "synthwave-84",
          "solarized",
          "zenburn",
        ],
        placeholder: "Theme (default: dracula-pro)",
      },

      {
        name: "font",
        type: "select",
        options: [
          "Fira Code",
          "JetBrains Mono",
          "Cascadia Code",
          "Hack",
          "IBM Plex Mono",
          "Source Code Pro",
          "Ubuntu Mono",
          "Inconsolata",
          "Space Mono",
        ],
        placeholder: "Font (default: Fira Code)",
      },

      {
        name: "background",
        type: "select",
        options: [
          {
            label: "Light Gray",
            value: "rgba(226,233,239,1)",
          },
          {
            label: "White",
            value: "rgba(255,255,255,1)",
          },
          {
            label: "Dark",
            value: "rgba(30,30,30,1)",
          },
          {
            label: "Transparent",
            value: "rgba(0,0,0,0)",
          },
        ],
        placeholder: "Background (default)",
      },
    ],
  },
],

  execution: async (req, res) => {
    try {
      let body = "";

      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        let data = {};
        try {
          data = body ? JSON.parse(body) : {};
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          return res.end(
            JSON.stringify({
             status: false,
              message: "Body harus JSON valid",
            }),
          );
        }

        const code = data.code;
        if (!code || !code.trim()) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          return res.end(
            JSON.stringify({
              status: false,
              message: "Parameter 'code' wajib diisi",
            }),
          );
        }

        const config = {
          ...DEFAULT_CONFIG,
          t: pick(data.theme, DEFAULT_CONFIG.t),
          fm: pick(data.font, DEFAULT_CONFIG.fm),
          bg: pick(data.background, DEFAULT_CONFIG.bg),
        };

        const params = new URLSearchParams(config);
        params.append("code", code);

        const targetUrl = `https://carbon.now.sh/?${params.toString()}`;

        const { data: result } = await mql(targetUrl, {
          screenshot: {
            element: ".export-container",
            optimizeForSpeed: true,
          },
          viewport: { width: 1024, height: 768 },
          waitFor: 3000,
          meta: false,
        });

        if (!result?.screenshot?.url) {
          throw new Error("Gagal generate gambar Carbon");
        }

        const imgRes = await fetch(result.screenshot.url);
        const buffer = Buffer.from(await imgRes.arrayBuffer());

        res.statusCode = 200;
        res.setHeader("Content-Type", "image/png");
        res.end(buffer);
      });
    } catch (err) {
      console.error("Carbon error:", err);

      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          status: false,
          message: err.message || "Carbon generation failed",
        }),
      );
    }
  },
};