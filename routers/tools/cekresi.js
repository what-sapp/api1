import { cekResi } from "../../lib/cekresi.js";

export default {
  path: "/api/tools/cek-resi",
  method: "GET",

  access: {
    register: true,
    apikey: true,
  },

  info: [
    {
      name: "Cek Resi",
      status: "Ready",
      method: "GET",
      desc: "Melacak resi pengiriman dari berbagai ekspedisi",

      params: [
        {
          name: "resi",
          type: "string",
          required: true,
          placeholder: "SPXID123456789",
        },
        {
          name: "kurir",
          type: "select",
          required: true,
          options: [
            { label: "JNE", value: "jne" },
            { label: "J&T Express", value: "jnt" },
            { label: "J&T Cargo", value: "jtcargo" },
            { label: "SiCepat", value: "sicepat" },
            { label: "Shopee Express", value: "spx" },
            { label: "Pos Indonesia", value: "pos" },
            { label: "Ninja Xpress", value: "ninja" },
            { label: "Lion Parcel", value: "lion" },
            { label: "AnterAja", value: "anteraja" },
            { label: "TIKI", value: "tiki" },
            { label: "Wahana", value: "wahana" },
            { label: "Lazada Express", value: "lex" },
            { label: "Paxel", value: "paxel" },
            { label: "SAP Express", value: "sap" },
            { label: "ID Express", value: "ide" },
            { label: "RPX", value: "rpx" },
            { label: "EMS", value: "ems" },
            { label: "First Logistics", value: "first" },
          ],
        },
      ],
    },
  ],

  execution: async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const resi = url.searchParams.get("resi");
    const kurir = url.searchParams.get("kurir");

    if (!resi || !kurir) {
      return res.writeHead(400, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: false,
          message: "resi & kurir wajib diisi",
        }),
      );
    }

    try {
      const result = await cekResi(resi, kurir);

      return res.writeHead(200, {
        "Content-Type": "application/json",
      }).end(
        JSON.stringify({
          status: true,
          data: result,
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
