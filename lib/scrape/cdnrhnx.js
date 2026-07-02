import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { fileTypeFromBuffer } from "file-type";

export async function uploadToRhnx(input) {
  try {
    if (typeof input === "string" && input.startsWith("http")) {
      const { data } = await axios.post(
        "https://cdn.rhnx.xyz/upload",
        {
          url: input,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (data?.url) {
        return {
          status: true,
          url: data.url,
          type: "url",
        };
      }

      throw new Error("No URL");
    }

    if (typeof input === "string" && fs.existsSync(input)) {
      const buffer = fs.readFileSync(input);
      const fileInfo = await fileTypeFromBuffer(buffer);
      const ext = fileInfo?.ext || "bin";
      const form = new FormData();

      form.append("file", buffer, `file.${ext}`);

      const { data } = await axios.post("https://cdn.rhnx.xyz/upload", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });

      if (data?.url) {
        return {
          status: true,
          url: data.url,
          type: "file",
          ext,
        };
      }

      throw new Error("No URL");
    }

    if (Buffer.isBuffer(input)) {
      const fileInfo = await fileTypeFromBuffer(input);

      const ext = fileInfo?.ext || "bin";
      const form = new FormData();
      form.append("file", input, `file.${ext}`);

      const { data } = await axios.post("https://cdn.rhnx.xyz/upload", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });

      if (data?.url) {
        return {
          status: true,
          url: data.url,
          type: "buffer",
          ext,
        };
      }

      throw new Error("No URL");
    }

    if (typeof input === "string") {
      const base64 = input.includes("base64,")
        ? input.split("base64,")[1]
        : input;

      const { data } = await axios.post(
        "https://cdn.rhnx.xyz/upload",
        {
          base64,
          ext: ".jpg",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (data?.url) {
        return {
          status: true,
          url: data.url,
          type: "base64",
        };
      }

      throw new Error("No URL");
    }

    throw new Error("Format tidak didukung");
  } catch (err) {
    console.error("❌ RHNX Error:", err.message);

    return {
      status: false,
      message: err.message,
    };
  }
}

export default uploadToRhnx;
