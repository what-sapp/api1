
<div align="center">
  <img src="https://raw.githubusercontent.com/rhnxofficial/Uploader/main/uploader/Screenshot 2026-06-22 213839.png" width="350">
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/rhnxofficial/Uploader/main/uploader/Screenshot 2026-06-22 214323.png" width="350">
</div>

# REST API

Halo bang 👋

Jadi gini, gua publish repo ini karena sekarang lagi gak fokus ngurusin REST API ini dulu. Lagi sibuk belajar dan bikin project lain, jadi daripada repo ini nganggur, mending gua share aja ke GitHub.

Siapa tau ada yang lagi butuh, mau belajar, nyari referensi, atau mau nyomot beberapa endpoint buat project sendiri. Gas aja, gratis kok 😆

## Status Project

⚠️ Untuk sekarang project ini gak gua maintain aktif.

Bukan karena projectnya mati, cuma guanya lagi pindah haluan dulu wkwk. Kalau suatu saat gua balik lagi ke project ini dan lagi ada mood, mungkin bakal gua update lagi.

## Sebelum Lu Deploy

Kalau lu mau deploy atau push web-nya ke domain sendiri, ada beberapa yang harus diubah dulu.

### 1. Ganti Domain API

Buka file:

```js
views/js/playground.js
```

Cari bagian ini:

```js
const BASE_DOMAIN =
  globalThis.location?.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://api.rhnx.xyz"; // ganti aja
```

Terus ganti `https://api.rhnx.xyz` jadi domain API punya lu sendiri.

Contoh:

```js
const BASE_DOMAIN =
  globalThis.location?.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://api.punyalu.com";
```

---

### 2. Kalau Mau Login Pakai Google

Buka file:

```js
lib/auth/google.js
```

Cari bagian ini:

```js
const GOOGLE_CLIENT_ID =
  "testestes"; // ganti pake punya lu, belum gua pindahin ke env 😭

const GOOGLE_CLIENT_SECRET =
  "testestes"; // ganti pake punya lu

const GOOGLE_REDIRECT =
  "https://localhost:3000/auth/google/callback";
```

Terus ganti semuanya pakai credential dari Google Cloud Console punya lu.

Contoh:

```js
const GOOGLE_CLIENT_ID = "CLIENT_ID_LU";

const GOOGLE_CLIENT_SECRET = "CLIENT_SECRET_LU";

const GOOGLE_REDIRECT =
  "https://domain-lu.com/auth/google/callback";
```

---

### Catatan

Iya, gua tau credential Google masih hardcode dan belum masuk `.env` 🗿

Nanti kalau lagi ada niat mungkin gua rapihin. Untuk sekarang ya begitulah, yang penting jalan dulu wkwk.

## Bug?

Kalau nemu bug, error, endpoint ngaco, atau ada yang tiba-tiba meledak pas dijalankan, ya mohon dimaklumi 🙏

Kalau sempet, boleh banget bikin Issue atau Pull Request.

## Penutup

Daripada ngendap di folder project dan jadi fosil di laptop gua, mending gua publish aja siapa tau ada yang kepake.

Kalau repo ini ngebantu lu walaupun cuma sedikit, berarti repo ini udah gak nganggur sia-sia 🗿

Happy ngoprek bang 🚀
