const fullscreenSidebar = document.getElementById("fullscreenSidebar");

function openSidebar() {
  fullscreenSidebar?.classList.remove("hidden");
}

function closeSidebar() {
  fullscreenSidebar?.classList.add("hidden");
}

const navbar = document.getElementById("navbar");
const navbarContainer = document.getElementById("navbarContainer");
function updateNavbar() {
  if (!navbar || !navbarContainer) return;
  const isScrolled = window.scrollY > 20;
  navbarContainer.classList.toggle("py-2", isScrolled);
  navbarContainer.classList.toggle("py-4", !isScrolled);
  navbar.classList.toggle("border-b", isScrolled);
  navbar.classList.toggle("border-gray-200", isScrolled);
  navbar.classList.toggle("dark:border-gray-800", isScrolled);
  navbar.classList.toggle("bg-white/80", isScrolled);
  navbar.classList.toggle("dark:bg-gray-900/80", isScrolled);
  navbar.classList.toggle("bg-transparent", !isScrolled);
}

window.addEventListener("scroll", updateNavbar);

updateNavbar();

const langButton = document.getElementById("langButton");
const langDropdown = document.getElementById("langDropdown");

langButton?.addEventListener("click", (e) => {
  e.stopPropagation();
  langDropdown?.classList.toggle("hidden");
});

document.addEventListener("click", () => {
  langDropdown?.classList.add("hidden");
});

document.querySelectorAll(".lang-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.dataset.lang;

    if (typeof setLanguage === "function") {
      setLanguage(lang);
    }
    langDropdown?.classList.add("hidden");
  });
});
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}
function updateProfileUI() {
  const profileButton = document.getElementById("profileButton");

  if (!profileButton) return;

  const user = getUser();
  if (user) {
    profileButton.innerHTML = `
      <i
        data-feather="user"
        class="w-5 h-5"
      ></i>
    `;

    profileButton.onclick = () => {
      window.location.href = "/profile.html";
    };
  } else {
    profileButton.textContent = "Login";
    profileButton.onclick = () => {
      window.location.href = "/register.html";
    };
  }
  window.feather?.replace();
}

document.addEventListener("DOMContentLoaded", () => {
  updateProfileUI();
  window.feather?.replace();
});

window.addEventListener("storage", updateProfileUI);
