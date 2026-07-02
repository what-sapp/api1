const getEl = (id) => document.getElementById(id);
const searchInput = getEl("searchInput");
const modal = getEl("searchModal");
const closeBtn = getEl("closeSearchBtn");
const modalInput = getEl("modalSearchInput");
const searchResults = getEl("searchResults");

let searchCache = [];

function getEndpointName(path) {
  return path.split("/").filter(Boolean).pop().replace(/[-_]/g, " ");
}

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadSearchData() {
  try {
    const res = await fetch("/api/endpoints");
    const data = await res.json();
    searchCache = data.map((e) => ({
      title: titleCase(getEndpointName(e.path)),
      path: e.path,
      folder: e.folder || "general",
      method: e.method || "GET",
    }));
  } catch (err) {
    console.warn("Gagal load search data");
  }
}

function openSearch() {
  modal?.classList.remove("hidden");

  modalInput?.focus();
}

function closeSearch() {
  modal?.classList.add("hidden");
  if (modalInput) modalInput.value = "";
  if (searchResults) {
    searchResults.innerHTML = "";
  }
}

if (searchInput && modal && modalInput && searchResults) {
  loadSearchData();

  searchInput.addEventListener("click", openSearch);
  closeBtn?.addEventListener("click", closeSearch);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeSearch();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    }
  });

  let debounce;

  modalInput.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = modalInput.value.toLowerCase().trim();
      searchResults.innerHTML = "";
      if (!q) return;
      const results = searchCache.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q) ||
          e.folder.toLowerCase().includes(q),
      );

      if (!results.length) {
        searchResults.innerHTML = `
          <div class="px-3 py-2 text-gray-500">
            Tidak ada hasil
          </div>
        `;

        return;
      }

      results.forEach((item) => {
        const div = document.createElement("div");
        div.className =
          "px-3 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700";

        div.innerHTML = `
          <div class="font-medium">
            ${item.title}
          </div>

          <div class="text-xs text-gray-500">
            📁 ${item.folder} • ${item.method} ${item.path}
          </div>
        `;

        div.onclick = () => {
          window.location.href =
            `/run.html?folder=${encodeURIComponent(item.folder)}` +
            `&endpoint=${encodeURIComponent(item.path)}`;

          closeSearch();
        };

        searchResults.appendChild(div);
      });
    }, 200);
  });
}

const footerDarkToggle = getEl("footerDarkModeToggle");

function applyDarkMode() {
  const enabled = localStorage.getItem("darkMode") === "enabled";

  document.documentElement.classList.toggle("dark", enabled);

  if (footerDarkToggle) {
    footerDarkToggle.checked = enabled;
  }
}

function setDarkMode(enabled) {
  document.documentElement.classList.toggle("dark", enabled);

  localStorage.setItem("darkMode", enabled ? "enabled" : "disabled");

  window.dispatchEvent(
    new CustomEvent("darkModeChanged", {
      detail: { enabled },
    }),
  );
}

applyDarkMode();

footerDarkToggle?.addEventListener("change", () => {
  setDarkMode(footerDarkToggle.checked);
});

window.addEventListener("pageshow", () => {
  applyDarkMode();
});

window.addEventListener("darkModeChanged", () => {
  applyDarkMode();
});

