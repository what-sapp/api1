export default {
  path: "/api/islamic/quran",
  method: "GET",
  access: {
    register: true,
    limit:true,
    apikey: true,
  },
  info: [
    {
      name: "Daftar Surat Al-Quran",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan seluruh daftar surat dalam Al-Quran",
    },
  ],

  execution: async (req, res) => {
    try {
      const response = await fetch(
        "https://api.myquran.com/v3/quran"
      );

      const result = await response.json();

      if (!result.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: false,
            message: "Gagal mengambil data Al-Quran",
          })
        );
      }
        
      const data = result.data.map((surah) => ({
        number: surah.number,
        name: surah.name,
        name_latin: surah.name_latin,
        ayat: surah.number_of_ayahs,
        translation: surah.translation,
        revelation: surah.revelation,
        audio: surah.audio_url,
        description:surah.description,
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: true,
            total: data.length,
            data,
          },
          null,
          2
        )
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: false,
          message: err.message,
        })
      );
    }
  },
};