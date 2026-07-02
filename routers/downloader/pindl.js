import axios from "axios";

async function anakbaik(inputUrl) {
  try {
    let finalUrl = inputUrl;

    if (inputUrl.includes("pin.it")) {
      const redirect = await axios.get(inputUrl, {
        maxRedirects: 5,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        },
      });

      finalUrl = redirect.request.res.responseUrl;
    }

    const { data } = await axios.get(finalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const videoMatch = data.match(
      /"contentUrl":"(https:\/\/v\d+\.pinimg\.com\/videos\/[^"]+\.mp4)"/
    );

    const imageMatch =
      data.match(
        /"url":"(https:\/\/i\.pinimg\.com\/originals\/[^"]+)"/
      ) ||
      data.match(
        /"url":"(https:\/\/i\.pinimg\.com\/736x\/[^"]+)"/
      ) ||
      data.match(
        /"url":"(https:\/\/i\.pinimg\.com\/564x\/[^"]+)"/
      );

    const thumbMatch = data.match(
      /"thumbnailUrl":"(https:\/\/[^"]+)"/
    );

    const titleMatch = data.match(/"name":"([^"]+)"/);
    const authorMatch = data.match(
      /"fullName":"([^"]+)".+?"username":"([^"]+)"/
    );
    const dateMatch = data.match(/"uploadDate":"([^"]+)"/);
    const keywordMatch = data.match(/"keywords":"([^"]+)"/);

    return {
      type: videoMatch ? "video" : "image",
      title: titleMatch ? titleMatch[1] : "-",
      author: authorMatch ? authorMatch[1] : "-",
      username: authorMatch ? authorMatch[2] : "-",
      media: videoMatch
        ? videoMatch[1]
        : imageMatch
        ? imageMatch[1]
        : "-",
      thumbnail: thumbMatch ? thumbMatch[1] : "-",
      uploadDate: dateMatch ? dateMatch[1] : "-",
      keywords: keywordMatch
        ? keywordMatch[1].split(",").map((x) => x.trim())
        : [],
    };
  } catch (e) {
    return { error: e.message };
  }
}

export default {
  path: "/api/downloader/pindl",
  method: "GET",
  access: {
    register: true,
    limit: true,
    apikey: true,
  },

  info: [
    {
      name: "Pindl",
      status: "Ready",
      method: "GET",
      desc: "Download media dari Pinterest",
      params: [
        {
          name: "url",
          type: "string",
          required: true,
          placeholder: "https://www.pinterest.com/pin/xxxxx",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    try {
      const u = new URL(req.url, `http://${req.headers.host}`);
      const url = u.searchParams.get("url");

      if (!url) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Parameter url wajib diisi",
          })
        );
      }

      const result = await anakbaik(url);

      if (result.error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Gagal mengambil data Pinterest",
            error: result.error,
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
           status: true,
            creator: "Raihan Fadillah",
            data: {
              type: result.type,
              title: result.title,
              author: {
                name: result.author,
                username: result.username,
              },
              uploadDate: result.uploadDate,
              keywords: result.keywords,
              media: result.media,
              thumbnail: result.thumbnail,
            },
          },
          null,
          2
        )
      );
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: "Internal Server Error",
          error: e.message,
        })
      );
    }
  },
};
