document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

  const DEFAULT_AVATAR = "https://files.catbox.moe/9ceimm.png";
  const token = localStorage.getItem("token");

  function showToast(message, type = "info") {
    const oldToast = document.getElementById("toast");

    if (oldToast) {
      oldToast.remove();
    }

    const colors = {
      success: "bg-emerald-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-sky-500",
    };

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = `
  fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
  min-w-[280px] max-w-[90%]
  text-white px-6 py-4 rounded-2xl
  shadow-[0_10px_40px_rgba(0,0,0,0.25)]
  backdrop-blur-xl border border-white/10
  ${colors[type] || colors.info}
  transition-all duration-300
`;

    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);
    toast.classList.add("opacity-0", "-translate-y-3");

    setTimeout(() => {
      toast.classList.remove("opacity-0", "-translate-y-3");
    }, 10);
    setTimeout(() => {
      toast.classList.add("opacity-0", "-translate-y-3");

      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  if (!token) {
    showToast("Silakan login terlebih dahulu", "warning");
    setTimeout(() => {
      window.location.href = "/register.html";
    }, 1500);

    return;
  }

  function getUser() {
    try {
      const data = localStorage.getItem("user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  async function loadUser() {
    try {
      const res = await fetch("/api/user", {
        headers: {
          Authorization: token,
        },
        cache: "no-store",
      });

      if (res.status === 401) {
        localStorage.clear();
        showToast("Session login habis", "error");

        setTimeout(() => {
          window.location.href = "/register.html";
        }, 1500);

        return;
      }

      if (!res.ok) {
        throw new Error("Gagal mengambil user");
      }

      const data = await res.json();

      if (!data?.status || !data?.user) {
        throw new Error("User tidak valid");
      }

      const userData = data.user;
      setUser(userData);

      document.getElementById("avatar").src = userData.avatar || DEFAULT_AVATAR;
      document.getElementById("name").textContent = userData.name || "-";
      document.getElementById("bio").textContent =
        userData.bio || "Belum ada bio.";
      document.getElementById("createdAt").textContent =
        "Bergabung: " + (userData.createdAt || "-");
      document.getElementById("userId").textContent = userData.id || "-";
      document.getElementById("premium").textContent = userData.premium
        ? "Yes"
        : "No";
      document.getElementById("premiumStart").textContent =
        userData.premiumStart || "-";
      document.getElementById("premiumEnds").textContent =
        userData.premiumEnds || "-";
      document.getElementById("phone").textContent = userData.phone || "-";
      document.getElementById("email").textContent = userData.email || "-";
      document.getElementById("limit").textContent = userData.limit ?? "-";
      document.getElementById("ip").textContent = userData.ip || "Unknown";
      document.getElementById("userApikey").value = userData.apikey || "-";
      document.getElementById("owner").textContent = userData.owner
        ? "Yes"
        : "No";
      document.getElementById("admin").textContent = userData.admin
        ? "Yes"
        : "No";

      const setPhoneBtn = document.getElementById("setPhone");
      setPhoneBtn.style.display = userData.phone ? "none" : "inline-block";
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat data user", "error");
    }
  }

  async function updateProfile(payload) {
    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Request gagal");
      }

      const data = await res.json();
      if (!data?.status || !data?.user) {
        throw new Error("Update gagal");
      }
      setUser(data.user);
      await loadUser();

      showToast("Profile berhasil diperbarui", "success");
    } catch (err) {
      console.error(err);

      showToast("Gagal update profile", "error");
    }
  }

  document.getElementById("setPhone").onclick = async () => {
    const userData = getUser();

    if (!userData) {
      return showToast("User tidak ditemukan", "error");
    }
    if (userData.phone) {
      return showToast("Nomor HP sudah terisi", "warning");
    }
    const phone = prompt("Masukkan nomor HP:");
    if (!phone) return;
    await updateProfile({ phone });
  };

  document.getElementById("editAvatar").onclick = async () => {
    const userData = getUser();
    if (!userData) return;
    const avatar = prompt("URL Avatar:", userData.avatar || "");
    const name = prompt("Nama:", userData.name || "");
    const bio = prompt("Bio:", userData.bio || "");
    await updateProfile({
      avatar: avatar || userData.avatar,
      name: name || userData.name,
      bio: bio || userData.bio,
    });
  };

  document.getElementById("copyApikey").onclick = async () => {
    try {
      await navigator.clipboard.writeText(
        document.getElementById("userApikey").value,
      );

      showToast("API Key berhasil disalin", "success");
    } catch {
      showToast("Gagal menyalin API Key", "error");
    }
  };

  document.getElementById("btn-more").onclick = () => {
    document.getElementById("dropdown").classList.toggle("hidden");
  };

  document.getElementById("logout").onclick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    showToast("Berhasil logout", "success");
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1200);
  };

  loadUser();

  window.addEventListener("focus", loadUser);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadUser();
    }
  });

  setInterval(loadUser, 15000);
});
