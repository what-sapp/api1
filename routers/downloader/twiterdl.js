export default {
  path: "/api/tools/twitterdl",
  method: "GET",

  access: {
    register: true,
    apikey: true,
      limit:true,
  },

  info: [
    {
      name: "Twitterdl",
      status: "Ready",
      method: "GET",
      desc: "Download video dari Twitter/X berdasarkan URL tweet",

      params: [
        {
          name: "url",
          type: "string",
          required: true,
          placeholder: "https://x.com/i/status/xxxx",
        },
      ],
    },
  ],

  execution: async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tweetUrl = url.searchParams.get("url");

    if (!tweetUrl) {
      return res.writeHead(400, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: false,
          message: "Parameter url wajib",
        }),
      );
    }

    try {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

      // STEP 1: GET PAGE
      const pageRes = await fetch("https://twittervideodownloader.com/en/", {
        headers: { "user-agent": ua },
      });

      const html = await pageRes.text();

      const csrf = html.match(
        /name="csrfmiddlewaretoken" value="([^"]+)"/,
      )?.[1];

      const gql = html.match(/name="gql" value="([^"]+)"/)?.[1];

      const cookie = pageRes.headers.get("set-cookie") || "";

      if (!csrf || !gql) {
        throw new Error("Token tidak ditemukan");
      }

      // STEP 2: POST DOWNLOAD REQUEST
      const postRes = await fetch(
        "https://twittervideodownloader.com/download",
        {
          method: "POST",
          headers: {
            "user-agent": ua,
            cookie,
            "content-type": "application/x-www-form-urlencoded",
            referer: "https://twittervideodownloader.com/en/",
          },
          body: `csrfmiddlewaretoken=${csrf}&tweet=${encodeURIComponent(
            tweetUrl,
          )}&gql=${encodeURIComponent(gql)}`,
        },
      );

      const text = await postRes.text();

      const thumb =
        text.match(/src="(https:\/\/pbs\.twimg\.com\/[^"]+)"/)?.[1] ||
        null;

      const regex =
        /href="(https:\/\/video\.twimg\.com\/[^"]+)"[^>]*>Download ([^<]+)<\/a>/g;

      const result = [];

      let match;
      while ((match = regex.exec(text)) !== null) {
        result.push({
          thumbnail: thumb,
          quality: match[2].split(":")[0].trim(),
          url: match[1],
        });
      }

      return res.writeHead(200, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: true,
          creator: "Raihan Fadillah",
          result,
        }),
      );
    } catch (err) {
      return res.writeHead(500, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: false,
          message: err.message,
        }),
      );
    }
  },
};