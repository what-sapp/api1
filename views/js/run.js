const changelogBtn = document.querySelector(
  'button[onclick="openChangelog()"]',
);

const changelogModal = document.getElementById("changelogModal");
const changelogList = document.getElementById("changelogList");
const folderNameEl = document.getElementById("folderName");
const runCategory = document.getElementById("run-category");
const runTitle = document.getElementById("run-title");
const runDesc = document.getElementById("run-desc");

function getFolderSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("folder") || "default";
}

function formatFolderName(slug) {
  if (!slug) return "Unknown";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLatestDate(data) {
  return Array.isArray(data) && data.length ? data[0].date : null;
}

function loadFolderName() {
  const folderSlug = getFolderSlug();
  if (!folderNameEl) return;
  const formatted = formatFolderName(folderSlug);
  folderNameEl.textContent = formatted;
  document.title = `${formatted} • RHNX`;
}

function loadRunMeta() {
  const params = new URLSearchParams(window.location.search);
  const folder = params.get("folder") || "default";
  const categoryEl = document.getElementById("run-category");
  const titleEl = document.getElementById("run-title");
  const descEl = document.getElementById("run-desc");
  if (!window.i18next) return;

  const baseKey = `run.${folder}`;
  const hasKey = i18next.exists(`${baseKey}.title`);
  const key = hasKey ? baseKey : "run.default";
  if (categoryEl) {
    categoryEl.textContent = i18next.t(`${key}.category`);
  }

  if (titleEl) {
    titleEl.textContent = i18next.t(`${key}.title`);
  }

  if (descEl) {
    descEl.textContent = i18next.t(`${key}.desc`);
  }
}

async function updateChangelogDot() {
  try {
    const res = await fetch("/api/changelog");
    if (!res.ok) {
      throw new Error("Failed fetch changelog");
    }

    const data = await res.json();
    const latestDate = getLatestDate(data);
    if (!latestDate || !changelogBtn) return;
    const readDate = localStorage.getItem("changelogReadDate");
    if (latestDate === readDate) return;
    if (changelogBtn.querySelector(".dot-red")) return;

    changelogBtn.style.position = "relative";
    changelogBtn.insertAdjacentHTML(
      "beforeend",
      `
      <span
        class="dot-red absolute -top-1 -right-1
               w-2.5 h-2.5 rounded-full
               bg-red-500 animate-pulse"
      ></span>
      `,
    );
  } catch (err) {
    console.error("Changelog dot error:", err);
  }
}

function renderChangelog(data = []) {
  if (!changelogList) return;
  changelogList.innerHTML = "";
  if (!data.length) {
    changelogList.innerHTML = `
      <li class="text-gray-500 dark:text-gray-400">
        Belum ada changelog.
      </li>
    `;

    return;
  }

  data.forEach((item, index) => {
    const isLast = index === data.length - 1;
    const li = document.createElement("li");

    li.className = `
      relative pl-2
      hover:translate-x-1
      transition duration-300
    `;

    li.innerHTML = `
      <div class="grid grid-cols-[24px_1fr] gap-4">

        <div class="relative flex justify-center">

          ${
            !isLast
              ? `
            <span
              class="absolute top-0 bottom-0 w-px
                     bg-gradient-to-b
                     from-blue-400/60
                     to-gray-300 dark:to-gray-700"
            ></span>
          `
              : ""
          }

          <span
            class="relative z-10 mt-1
                   w-3 h-3 rounded-full
                   bg-blue-500 dark:bg-blue-400
                   ring-4 ring-blue-500/10
                   dark:ring-blue-400/10"
          ></span>
        </div>

        <div
          class="pb-6 border-b border-gray-100
                 dark:border-gray-800"
        >
          <div
            class="text-xs tracking-wide uppercase
                   text-gray-400 dark:text-gray-500 mb-2"
          >
            ${item.date}
          </div>

          <div
            class="text-sm leading-relaxed
                   text-gray-700 dark:text-gray-200"
          >
            ${item.desc}
          </div>
        </div>
      </div>
    `;

    changelogList.appendChild(li);
  });
}

window.openChangelog = async function () {
  if (!changelogModal || !changelogList) return;

  changelogList.innerHTML = `
    <li class="text-gray-500 dark:text-gray-400 animate-pulse">
      Memuat changelog...
    </li>
  `;
  changelogModal.classList.remove("hidden");

  try {
    const res = await fetch("/api/changelog");
    if (!res.ok) {
      throw new Error("Gagal load changelog");
    }
    const data = await res.json();
    renderChangelog(data);

    const dot = changelogBtn?.querySelector(".dot-red");
    if (dot) {
      dot.remove();
    }
    const latestDate = getLatestDate(data);
    if (latestDate) {
      localStorage.setItem("changelogReadDate", latestDate);
    }
  } catch (err) {
    console.error(err);

    changelogList.innerHTML = `
      <li class="text-red-500">
        ${err.message}
      </li>
    `;
  }
};

window.closeChangelog = function () {
  if (!changelogModal) return;
  changelogModal.classList.add("hidden");
};

window.addEventListener("click", (e) => {
  if (e.target === changelogModal) {
    changelogModal.classList.add("hidden");
  }
});

window.addEventListener("languageChanged", () => {
  loadRunMeta();
});

document.addEventListener("DOMContentLoaded", () => {
  loadFolderName();
  loadRunMeta();
  updateChangelogDot();
});
