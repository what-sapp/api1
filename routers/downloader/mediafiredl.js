import axios from "axios";
import * as cheerio from "cheerio";


const REGEX = {
  folder: /\.com\/folder\/([^\/]+)\/?/,
  file: /\.com\/(view|file)\/([a-zA-Z0-9]+)/,
};


const client = axios.create({
  baseURL: "https://www.mediafire.com",

  headers: {
    "accept-encoding": "gzip, deflate, br, zstd",

    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJSON(res, data) {
  res.setHeader?.("Content-Type", "application/json");
  return res.end(JSON.stringify(data));
}

async function extractFromWeb(link) {
  const fixedLink = link.replace(".com/view", ".com/file");

  const response = await client.get(fixedLink);
  const $ = cheerio.load(response.data);
  const downloadUrl = $(".input.popsok").attr("href");

  if (!downloadUrl || !/\/\/download\d+\.mediafire\.com\//.test(downloadUrl)) {
    throw new Error("Failed to find download URL");
  }

  const name = $(".intro .filename").text().trim();

  const date = $(".details li:nth-child(2) span").text().trim();

  const size = $(".details li:nth-child(1) span").text().trim();

  const type = $(".intro .filetype").text().trim();

  const continents = {
    af: "Africa",
    an: "Antarctica",
    as: "Asia",
    eu: "Europe",
    na: "North America",
    oc: "Oceania",
    sa: "South America",
  };

  const uploadLocation = $(".DLExtraInfo-uploadLocation");

  const continentCode = uploadLocation
    .find(".DLExtraInfo-uploadLocationRegion")
    .attr("data-lazyclass")
    ?.replace("continent-", "");

  const location = uploadLocation
    .find(".DLExtraInfo-sectionDetails p")
    .text()
    .match(/from (.*?) on/)?.[1];

  const flag = uploadLocation
    .find("div.lazyload.flag")
    .attr("data-lazyclass")
    ?.replace("flag-", "");

  return {
    name,
    size_format: size,
    uploaded: date,
    mime: type,

    continent: continents[continentCode] || "Unknown",

    flag,
    location,

    url: downloadUrl,
  };
}

async function getFolder(folderKey) {
  const { data: info } = await client.get("/api/1.4/folder/get_info.php", {
    params: {
      recursive: "yes",
      folder_key: folderKey,
      response_format: "json",
    },
  });

  let files = [];
  let chunk = 1;

  while (true) {
    const { data } = await client.get("/api/1.4/folder/get_content.php", {
      params: {
        r: "hrdd",
        content_type: "files",
        filter: "all",
        order_by: "name",
        order_direction: "asc",
        chunk,
        version: "1.5",
        folder_key: folderKey,
        response_format: "json",
      },
    });

    const currentFiles = data?.response?.folder_content?.files || [];

    currentFiles.forEach((file) => {
      files.push({
        ...file,
        links: file.links?.normal_download || null,
      });
    });

    const moreChunks = data?.response?.folder_content?.more_chunks;

    if (moreChunks === "no") break;

    chunk++;

    await sleep(2000);
  }

  return {
    status: true,
    type: "folder",

    ...info.response.folder_info,

    total_files: files.length,

    files,
  };
}
async function getFile(quickKey, originalLink) {
  const { data } = await client.get("/api/1.5/file/get_info.php", {
    params: {
      quick_key: quickKey,
      response_format: "json",
    },
  });

  const info = data.response.file_info;

  let webData = await extractFromWeb(originalLink);

  if (!webData.mime) {
    webData = await extractFromWeb(originalLink);
  }

  return {
    status: true,
    type: "file",

    ...info,

    links: info.links?.normal_download || null,

    ...webData,

    ...(info.links?.view
      ? {
          preview:
            client.defaults.baseURL +
            "/convkey/" +
            info.hash.substring(0, 4) +
            "/" +
            info.quickkey +
            "9g." +
            info.filename.split(".").pop(),
        }
      : {}),
  };
}

async function mediafire(link) {
  if (!link) {
    throw new Error("Link is required");
  }

  if (REGEX.folder.test(link)) {
    const match = link.match(REGEX.folder);

    const folderKey = match?.[1];

    if (!folderKey) {
      throw new Error("Invalid folder link");
    }

    return await getFolder(folderKey);
  }

  const match = link.match(REGEX.file);

  const quickKey = match?.[2];

  if (!quickKey) {
    throw new Error("Invalid MediaFire link");
  }

  return await getFile(quickKey, link);
}

export default {
  path: "/api/downloader/mediafire",
  method: "GET",

  access: {
    register: false,
  },

  info: [
    {
      name: "MediaFire dl",
      status: "Ready",
      method: "GET",

      desc: "Get MediaFire file / folder information",

      params: [
        {
          name: "url",
          type: "string",

          placeholder: "https://www.mediafire.com/file/xxxx/file.zip/file",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const url = new URL(
        req.url,
        `http://${req.headers.host}`,
      ).searchParams.get("url");

      if (!url) {
        return sendJSON(res, {
          status: false,
          message: "Parameter url wajib diisi",
        });
      }

      const result = await mediafire(url);

      return sendJSON(res, result);
    } catch (err) {
      return sendJSON(res, {
        status: false,
        code: 500,

        message: err?.response?.data || err?.message || String(err),
      });
    }
  },
};
