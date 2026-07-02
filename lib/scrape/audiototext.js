import axios from "axios";
import https from "https";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);

const BASE = "https://audioconvert.ai";
const PAGE_URL = `${BASE}/id`;

const JWT_SECRET = "auc995cx6se";

const LANGUAGE_CODE = "";
const SCENARIO = "auto";

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createGuestBearer(userId = crypto.randomUUID()) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    userId,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return {
    userId,
    token: `${data}.${signature}`,
  };
}

const guest = createGuestBearer();

const client = axios.create({
  timeout: 30000,
  validateStatus: () => true,
});

const headersBase = {
  "user-agent": USER_AGENT,
  authorization: `Bearer ${guest.token}`,
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  referer: PAGE_URL,
  "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": `"Android"`,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanUploadUrl(uploadUrl) {
  return uploadUrl.split("?")[0];
}

async function getDurationMinutes(filePath) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    const seconds = Number(stdout.trim());

    if (!Number.isFinite(seconds) || seconds <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(seconds / 60));
  } catch {
    return 1;
  }
}

async function warmup() {
  await client.get(PAGE_URL, {
    headers: {
      "user-agent": USER_AGENT,
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      referer: BASE,
      "upgrade-insecure-requests": "1",
      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`,
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
    },
  });
}

async function presign(filename) {
  const url = `${BASE}/api/resource/upload/presign?filename=${encodeURIComponent(filename)}`;

  const { data, status } = await client.get(url, {
    headers: {
      ...headersBase,
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    },
  });

  if (
    status < 200 ||
    status >= 300 ||
    data?.code !== 100000 ||
    !data?.data?.upload_url
  ) {
    throw new Error(`Presign gagal HTTP ${status}: ${JSON.stringify(data)}`);
  }

  return data.data.upload_url;
}

async function uploadToOss(uploadUrl, filePath) {
  const fileSize = fs.statSync(filePath).size;

  const url = new URL(uploadUrl);

  await new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "PUT",
        headers: {
          "Content-Length": fileSize,
        },
      },
      (res) => {
        let body = "";

        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(
              new Error(`Upload OSS gagal HTTP ${res.statusCode}: ${body}`),
            );
          }
        });
      },
    );

    req.on("error", reject);

    fs.createReadStream(filePath).on("error", reject).pipe(req);
  });

  return cleanUploadUrl(uploadUrl);
}

async function checkGuestQuota(durationMinutes) {
  const { data, status } = await client.post(
    `${BASE}/api/transcribe/check-guest-quota`,
    {
      duration_minutes: durationMinutes,
    },
    {
      headers: {
        ...headersBase,
        accept: "application/json",
        "content-type": "application/json",
        origin: BASE,
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
      },
    },
  );

  if (status < 200 || status >= 300 || data?.code !== 100000) {
    throw new Error(
      `Check quota gagal HTTP ${status}: ${JSON.stringify(data)}`,
    );
  }

  if (!data?.data?.allowed) {
    throw new Error(`Quota tidak allowed`);
  }

  return true;
}

async function createTranscribe(audioUrl, fileName) {
  const payload = {
    audio_url: audioUrl,
    language_code: LANGUAGE_CODE,
    file_name: fileName,
    scenario: SCENARIO,
  };

  const { data, status } = await client.post(
    `${BASE}/api/transcribe/`,
    payload,
    {
      headers: {
        ...headersBase,
        accept: "application/json",
        "content-type": "application/json",
        origin: BASE,
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
      },
    },
  );

  if (
    status < 200 ||
    status >= 300 ||
    data?.code !== 100000 ||
    !data?.data?.id
  ) {
    throw new Error(
      `Submit transcribe gagal HTTP ${status}: ${JSON.stringify(data)}`,
    );
  }

  return data.data;
}

async function getTranscribe(taskId) {
  const { data, status } = await client.get(
    `${BASE}/api/transcribe/${taskId}`,
    {
      headers: {
        ...headersBase,
        accept: "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
      },
    },
  );

  return {
    status,
    data,
  };
}

function extractText(data) {
  const d = data?.data ?? data;

  if (!d) return null;

  if (typeof d === "string") return d;

  const value =
    d.text ??
    d.transcript ??
    d.result ??
    d.content ??
    d.transcription ??
    d.segments
      ?.map((x) => x.text)
      .filter(Boolean)
      .join(" ") ??
    null;

  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return (
      value.text ??
      value.transcript ??
      value.result ??
      value.content ??
      value.transcription ??
      null
    );
  }

  return null;
}

async function pollResult(taskId) {
  for (let i = 0; i < 40; i++) {
    const { status, data } = await getTranscribe(taskId);

    if (data?.code === 100001 || data?.message === "Need Login") {
      return {
        done: false,
        need_login: true,
        text: null,
      };
    }

    if (status >= 200 && status < 300 && data?.code === 100000) {
      const task = data.data;

      const text = extractText(data);

      if (
        task?.status === "succeeded" ||
        task?.status === "success" ||
        task?.status === "completed" ||
        text
      ) {
        return {
          done: true,
          need_login: false,
          text,
        };
      }

      if (task?.status === "failed" || task?.status === "error") {
        throw new Error(task?.error ?? data?.message ?? "Transcribe failed");
      }
    }

    await sleep(3000);
  }

  return {
    done: false,
    need_login: false,
    text: null,
  };
}

const audioToText = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("File tidak ditemukan");
  }

  await warmup();

  const fileName = path.basename(filePath);
  const durationMinutes = await getDurationMinutes(filePath);
  const uploadUrl = await presign(fileName);
  const audioUrl = await uploadToOss(uploadUrl, filePath);
  await checkGuestQuota(durationMinutes);
  const task = await createTranscribe(audioUrl, fileName);
  const poll = await pollResult(task.id);

  return {
    teksnya: poll.text,
    audio: {
      fileName,
      durationMinutes,
      audioUrl,
      taskId: task.id,
    },
  };
};

export { audioToText };
