const langCode = document.getElementById("langCode");
const LANG_MAP = {
  id: {
    code: "ID",
  },

  en: {
    code: "EN",
  },
};

function updateLangUI(lang) {
  const info = LANG_MAP[lang] || LANG_MAP.id;

  if (langCode) {
    langCode.textContent = info.code;
  }
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
}

function updateContent() {
  if (!window.i18next) return;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;

    if (!key) return;

    el.innerHTML = i18next.t(key);
  });
}

function refreshLanguage(lang) {
  updateContent();
  if (typeof loadRunMeta === "function") {
    loadRunMeta();
  }
  updateLangUI(lang);
}

window.setLanguage = function (lang) {
  if (!window.i18next) return;

  i18next
    .changeLanguage(lang)
    .then(() => {
      refreshLanguage(lang);
    })
    .catch((err) => {
      console.error("Language error:", err);
    });
};

const savedLang = localStorage.getItem("language") || "id";
if (window.i18next) {
  i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
      lng: savedLang,
      fallbackLng: "id",
      backend: {
        loadPath: "/lang/{{lng}}.json",
      },

      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
      interpolation: {
        escapeValue: false,
      },
    })
    .then(() => {
      refreshLanguage(i18next.language);
    })
    .catch((err) => {
      console.error("i18next init error:", err);
    });
}

window.addEventListener("storage", (e) => {
  if (e.key !== "language") return;

  const lang = e.newValue || "id";

  if (!window.i18next) return;

  i18next.changeLanguage(lang).then(() => {
    refreshLanguage(lang);
  });
});
window.addEventListener("pageshow", () => {
  const lang = localStorage.getItem("language") || "id";

  if (!window.i18next) return;

  if (i18next.language === lang) {
    refreshLanguage(lang);
    return;
  }

  i18next.changeLanguage(lang).then(() => {
    refreshLanguage(lang);
  });
});
