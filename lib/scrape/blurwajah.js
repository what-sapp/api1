import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import sharp from "sharp";

const TOKEN =
  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJhdWQiOiIiLCJpYXQiOjE1MjMzNjQ4MjQsIm5iZiI6MTUyMzM2NDgyNCwianRpIjoicHJvamVjdF9wdWJsaWNfYzkwNWRkMWMwMWU5ZmQ3NzY5ODNjYTQwZDBhOWQyZjNfT1Vzd2EwODA0MGI4ZDJjN2NhM2NjZGE2MGQ2MTBhMmRkY2U3NyJ9.qvHSXgCJgqpC4gd6-paUlDLFmg0o2DsOvb1EUYPYx_E";

const TASK_ID =
  "x2t3tlAvykrw8nmx03zbhqp7t9v0z0pncy2z95ym9n09r5bbkdfmwjgh5c2sx2g1mn6341ffp538crc1f1xq7ykApwgvk4x0d57hsnlvkvy9cth9md9l4czvv774sdw2j5kvmrv4y7wnbqv2rmw1s4Ask14h70rgt51kdcs88zj3A7tr3x0q";

export async function faceBlur(imagePath, outputPath = "result.png") {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error("Image tidak ditemukan");
    }
    const uploadForm = new FormData();

    uploadForm.append("chunk", "0");
    uploadForm.append("chunks", "1");
    uploadForm.append("task", TASK_ID);
    uploadForm.append("preview", "1");
    uploadForm.append("v", "web.0");
    uploadForm.append("file", fs.createReadStream(imagePath));

    const { data: uploaded } = await axios.post(
      "https://api19.iloveimg.com/v1/upload",
      uploadForm,
      { headers: { Authorization: TOKEN, ...uploadForm.getHeaders() } },
    );

    if (!uploaded?.server_filename) {
      throw new Error("Upload gagal");
    }


    const detectForm = new FormData();

    detectForm.append("task", TASK_ID);
    detectForm.append("level", "recommended");
    detectForm.append(
      "fileArray[0][server_filename]",
      uploaded.server_filename,
    );

    const { data: detected } = await axios.post(
      "https://api19.iloveimg.com/v1/detectfaces",
      detectForm,
      { headers: { Authorization: TOKEN, ...detectForm.getHeaders() } },
    );

    const faces = detected?.data?.coordArray || [];

    if (!faces.length) {
      throw new Error("Wajah tidak ditemukan");
    }

    const composites = [];

    for (const face of faces) {
      const left = Math.max(0, Math.floor(face.x));
      const top = Math.max(0, Math.floor(face.y));
      const width = Math.floor(face.width);
      const height = Math.floor(face.height);

      const blurredFace = await sharp(imagePath)
        .extract({ left, top, width, height })
        .blur(30)
        .toBuffer();

      composites.push({
        input: blurredFace,
        left,
        top,
      });
    }

    await sharp(imagePath).composite(composites).png().toFile(outputPath);

    return {
      status: true,
      message: "Face blur berhasil",
      output: outputPath,
      total_faces: faces.length,
    };
  } catch (err) {
    return {
      status: false,
      message: err.message,
    };
  }
}
