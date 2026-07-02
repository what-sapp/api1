import fs from "fs";
import path from "path";
import { EdgeTTS } from "node-edge-tts";

import uploadToRhnx from "../../lib/scrape/cdnrhnx.js";
import voices from "../../lib/scrape/json/voice.json" with { type: "json" };

export default {
  path: "/api/converter/edge-tts",
  method: "POST",

  access: {
    register: true,
    apikey: true,
    limit: true,
  },

  info: [
    {
      name: "TTS Microsoft Edge",
      status: "Ready",
      method: "POST",
      desc: "Convert text menjadi audio menggunakan Microsoft Edge TTS",

      params: [
        {
          name: "text",
          type: "string",
          input: "textarea",
          required: true,
          placeholder: "Masukkan teks...",
        },
        {
          name: "voice",
          type: "select",
          required: false,
          placeholder: "Pilih Voice",
          options: voices.map((v) => v.ShortName),
        },
      ],
    },
  ],

  execution: async (req, res) => {
    let outputPath = null;

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      // Parse body manual
      let body = {};

      try {
        let raw = "";

        for await (const chunk of req) {
          raw += chunk;
        }

        if (raw) {
          body = JSON.parse(raw);
        }
      } catch {}

      const text = String(
        body.text || url.searchParams.get("text") || "",
      ).trim();

      const voice =
        body.voice || url.searchParams.get("voice") || "id-ID-ArdiNeural";

      if (!text) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify(
            {
              status: false,
              message: "text wajib diisi",
            },
            null,
            2,
          ),
        );
      }

      const voiceData = voices.find((v) => v.ShortName === voice);

      if (!voiceData) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify(
            {
              status: false,
              message: "Voice tidak valid",
            },
            null,
            2,
          ),
        );
      }

      const tmpDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, {
          recursive: true,
        });
      }

      outputPath = path.join(tmpDir, `tts-${Date.now()}.mp3`);

      const edge = new EdgeTTS({
        voice: voiceData.ShortName,
        lang: voiceData.Locale,
        outputFormat:
          voiceData.SuggestedCodec || "audio-24khz-96kbitrate-mono-mp3",
      });

      await edge.ttsPromise(text, outputPath);

      if (!fs.existsSync(outputPath)) {
        throw new Error("Audio gagal dibuat");
      }

      const upload = await uploadToRhnx(outputPath);

      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      if (!upload.status) {
        throw new Error(upload.message || "Upload CDN gagal");
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
              url: upload.url,
              expired: "1 menit",
              text,

              voice: {
                name: voiceData.Name,
                shortName: voiceData.ShortName,
                gender: voiceData.Gender,
                locale: voiceData.Locale,
                friendlyName: voiceData.FriendlyName,
              },
            },
          },
          null,
          2,
        ),
      );
    } catch (e) {
      console.error(e);

      if (outputPath && fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
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
  },
};
