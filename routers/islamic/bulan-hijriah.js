export default {
  path: "/api/islamic/bulan-hijriah",
  method: "GET",
 access: {
    register: true,
    limit:true,
    apikey: true,
  },
  info: [
    {
      name: "Daftar Bulan Hijriah",
      status: "Ready",
      method: "GET",
      desc: "Menampilkan daftar 12 bulan dalam kalender Hijriah lengkap dengan nama Arab dan deskripsi",
    },
  ],

  execution: (req, res) => {
    const hijriMonths = [
      {
        order: 1,
        name_id: "Muharram",
        name_ar: "مُحَرَّم",
        description: "Bulan pertama, tahun baru Islam",
      },
      {
        order: 2,
        name_id: "Safar",
        name_ar: "صَفَر",
        description: "Bulan kedua",
      },
      {
        order: 3,
        name_id: "Rabiul Awal",
        name_ar: "رَبِيْعُ الأَوّل",
        description: "Bulan kelahiran Nabi Muhammad",
      },
      {
        order: 4,
        name_id: "Rabiul Akhir",
        name_ar: "رَبِيْعُ الثَّانِي",
        description: "Bulan keempat",
      },
      {
        order: 5,
        name_id: "Jumadil Awal",
        name_ar: "جَمَادِي الأَوّل",
        description: "Bulan kelima",
      },
      {
        order: 6,
        name_id: "Jumadil Akhir",
        name_ar: "جَمَادِي الثَّانِي",
        description: "Bulan keenam",
      },
      {
        order: 7,
        name_id: "Rajab",
        name_ar: "رَجَب",
        description: "Salah satu bulan suci (haram)",
      },
      {
        order: 8,
        name_id: "Sya'ban",
        name_ar: "شَعْبَان",
        description: "Bulan kedelapan",
      },
      {
        order: 9,
        name_id: "Ramadhan",
        name_ar: "رَمَضَان",
        description: "Bulan puasa",
      },
      {
        order: 10,
        name_id: "Syawal",
        name_ar: "شَوَّال",
        description: "Bulan kesepuluh, Idul Fitri",
      },
      {
        order: 11,
        name_id: "Dzulqa'dah",
        name_ar: "ذُو القَعْدَة",
        description: "Bulan kesebelas, bulan suci",
      },
      {
        order: 12,
        name_id: "Dzulhijjah",
        name_ar: "ذُو الحِجَّة",
        description: "Bulan haji/Qurban",
      },
    ];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: true,
        creator: "Raihan Fadillah",
        message: "Daftar bulan Hijriah berhasil diambil",
        total: hijriMonths.length,
        hijri_months: hijriMonths,
      })
    );
  },
};