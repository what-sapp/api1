document.addEventListener("DOMContentLoaded", () => {

  // ini sesuikan yah domain nya kalo udah di public web nya ganti pake domaian kamu
const BASE_DOMAIN =
  globalThis.location?.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://api.rhnx.xyz"; // ganti aja


  const sound = {
    success: new Audio("/media/audio/success.mp3"),
    error: new Audio("/media/audio/error.mp3"),
    denied: new Audio("/media/audio/danied.mp3"),
  };

  function playSound(type) {
    if (!sound[type]) return;
    sound[type].currentTime = 0;
    sound[type].play().catch(() => {});
  }
  window.goBackToPlayground = function () {
    if (document.referrer) {
      window.history.back();
    } else {
      window.location.href = "/folder";
    }
  };

  const tbody = document.getElementById("endpoint-table-body");
  const modal = document.getElementById("output-container");
  const closeBtn = document.getElementById("close-output");

  const elMethod = document.getElementById("endpoint-method");
  const elPath = document.getElementById("endpoint-path");
  const elDesc = document.getElementById("endpoint-desc");
  const elFullUrl = document.getElementById("endpoint-full-url");
  const copyBtn = document.getElementById("copy-url");
  const paramBox = document.getElementById("param-box");

  const runBtn = document.getElementById("run-endpoint");
  const reportBtn = document.getElementById("report-endpoint");
  const outputBox = document.getElementById("output-result");
  const loading = document.getElementById("output-loading");
  const copyResultBtn = document.getElementById("copy-result");

  const snippetBox = document.getElementById("code-snippets");
  const snippetOutput = document.getElementById("snippet-output");

  async function loadEndpoints() {
    tbody.innerHTML = "";

    const qs = new URLSearchParams(location.search);
    const folder = qs.get("folder");

    const res = await fetch(
      folder ? `/api/endpoints?folder=${folder}` : "/api/endpoints",
    );
    const groups = await res.json();
    if (!Array.isArray(groups)) return;
    groups.forEach((group) => {
      group.info.forEach((item) => {
        tbody.insertAdjacentHTML(
          "beforeend",
          `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">

        <td class="px-4 py-2 text-center">
          <i
            data-feather="${item.status === "Ready" ? "check" : "x"}"
            class="${
              item.status === "Ready" ? "text-sky-600" : "text-red-500"
            } w-4 h-4 inline"
          ></i>
        </td>

        <td class="px-4 py-2">
          ${item.name}
        </td>

        <td class="px-4 py-2 text-center">
          <span class="px-2 py-0.5 text-xs rounded ${
            item.method === "GET"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }">
            ${item.method}
          </span>
        </td>

        <td class="px-4 py-2 text-center">
         <button
  class="text-sky-600 hover:text-sky-800 transition"
  onclick='openPlayground(
    ${JSON.stringify(group)},
    ${JSON.stringify(item)}
  )'
  >
   <i 
    data-feather="play-circle"
    class="w-5 h-5"
  ></i>
</button>
        </td>

      </tr>
      `,
        );
      });
    });

    feather.replace();
  }

  let currentGroup = null;
  let currentItem = null;

  window.openPlayground = function (group, item) {
    currentGroup = group;
    currentItem = item;

    modal.classList.remove("hidden");
    currentAccess = group.access || {};
    outputBox.innerHTML = "";
    snippetOutput.textContent = "";
    snippetOutput.classList.add("hidden");
    elMethod.textContent = item.method;

    elMethod.className =
      "px-2 py-1 text-xs font-semibold rounded-md border " +
      (item.method === "GET"
        ? "border-yellow-500 text-yellow-600"
        : "border-green-500 text-green-600");

    elPath.value = group.path;
    elDesc.textContent = item.desc || "-";
    elFullUrl.value = BASE_DOMAIN + group.path;
    paramBox.innerHTML = "";
    (item.params || []).forEach((p) => {
      paramBox.insertAdjacentHTML("beforeend", renderParam(p));
    });

    document.querySelectorAll("[data-param]").forEach((el) => {
      el.oninput = updateFullUrl;
      el.onchange = updateFullUrl;
    });

    document.querySelectorAll(".file-ui").forEach((ui) => {
      const wrapper = ui.closest(".relative");
      const input = wrapper.querySelector(".file-input");
      const text = wrapper.querySelector(".file-text");
      ui.onclick = () => input.click();
      input.onchange = () => {
        text.textContent =
          input.files.length > 0 ? input.files[0].name : "📁 Choose file";
      };
    });

    runBtn.onclick = () => runEndpoint(group, item);
    reportBtn.onclick = () => openReport(currentGroup, currentItem);
    updateFullUrl();
  };

  async function openReport(group, item) {
    const jenis = prompt(
      `Pilih jenis report:

1. error
2. bug
3. endpoint mati
4. output salah
5. request feature
6. lainnya

ketik salah satu`,
    );

    if (!jenis) return;

    if (!["1", "2", "3", "4", "5", "6"].includes(jenis)) {
      playSound("error");

      return alert("Jenis report tidak valid");
    }

    const detail = prompt("Jelaskan masalahnya:");

    if (!detail) return;

    try {
      const reportTypes = {
        1: "error",
        2: "bug",
        3: "endpoint mati",
        4: "output salah",
        5: "request feature",
        6: "lainnya",
      };

      const res = await fetch("/api/report", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          endpoint: group.path,
          method: item.method,
          type: reportTypes[jenis],
          detail,
          output: outputBox.textContent || null,
        }),
      });

      const data = await res.json();

      if (data.status) {
        playSound("success");

        alert("Report terkirim");
      } else {
        playSound("error");

        alert(data.message || "Gagal kirim report");
      }
    } catch (e) {
      playSound("error");

      alert("ERROR: " + e.message);
    }
  }
  function renderParam(p) {
    const placeholder = p.placeholder || p.name;

    const base =
      `data-param="${p.name}" data-type="${p.type || "string"}"` +
      ` class="w-full px-3 py-2 rounded-md border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"` +
      (p.required ? " required" : "");

    let input = "";

    if (p.input === "textarea") {
      input = `<textarea ${base} rows="1" placeholder="${placeholder}"></textarea>`;
    } else if (p.type === "select") {
      let options = p.options || [];

      if (typeof options === "function") {
        options = options();
      }

      input = `
    <select ${base}>
      <option value="">${placeholder}</option>
      ${options
        .map((opt) => {
          if (typeof opt === "string") {
            return `<option value="${opt}">${opt}</option>`;
          }

          return `
            <option value="${opt.value}">
              ${opt.label}
            </option>
          `;
        })
        .join("")}
    </select>
  `;
    } else if (p.type === "file") {
      input = `
    <div class="relative w-full">
      
      <input 
        type="file"
        data-param="${p.name}" 
        data-type="file"
        class="hidden file-input"
        ${p.accept ? `accept="${p.accept}"` : ""}
        ${p.required ? "required" : ""}
      >

      <div class="file-ui flex items-center justify-between 
                  px-4 py-3 
                  rounded-md 
                  border border-black
                  bg-white dark:bg-gray-800
                  text-sm text-gray-700 dark:text-gray-200
                  cursor-pointer
                  transition ">

        <span class="file-text truncate">
          📁 Choose file
        </span>

        <span class="text-xs bg-black text-white px-3 py-1 rounded-sm">
          Upload
        </span>

      </div>
    </div>
  `;
    } else if (p.type === "number") {
      input = `<input type="number" ${base} placeholder="${placeholder}">`;
    } else if (p.type === "boolean") {
      input = `
      <select ${base}>
        <option value="">-- pilih --</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    `;
    } else if (p.type === "json") {
      input = `<textarea ${base} rows="1" placeholder="${placeholder}"></textarea>`;
    } else {
      input = `<input type="text" ${base} placeholder="${placeholder}">`;
    }

    return `
    <div class="space-y-1">
      <label class="text-sm font-medium">${p.name}</label>
      ${input}
    </div>
  `;
  }

  function updateFullUrl() {
    const params = {};

    document.querySelectorAll("[data-param]").forEach((el) => {
      if (el.value) params[el.dataset.param] = el.value;
    });

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (currentAccess?.apikey === true && user?.apikey) {
        params.apikey = user.apikey;
      }
    } catch {}

    const qs = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";

    elFullUrl.value = BASE_DOMAIN + elPath.value + qs;
  }

  function buildSnippetData(method, fullUrl) {
    const urlObj = new URL(fullUrl);
    const params = Object.fromEntries(urlObj.searchParams.entries());

    return {
      method,
      url: urlObj.origin + urlObj.pathname,
      params,
    };
  }

  const snippets = {
    node: (method, fullUrl) => {
      const { url, params } = buildSnippetData(method, fullUrl);

      const hasFile = document.querySelector('[data-type="file"]');

      if (method === "GET") {
        return `import fetch from "node-fetch";

const res = await fetch("${fullUrl}");
const data = await res.json();

console.log(data);`;
      }

      if (hasFile) {
        return `import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

const form = new FormData();

form.append(
  "file",
  fs.createReadStream("./image.jpg")
);

${Object.entries(params)
  .map(([k, v]) => `form.append("${k}", "${v}");`)
  .join("\n")}

const res = await fetch("${url}", {
  method: "POST",
  body: form
});

const contentType =
  res.headers.get("content-type") || "";

if (contentType.startsWith("image/")) {

  const buffer = Buffer.from(
    await res.arrayBuffer()
  );

  fs.writeFileSync(
    "result.png",
    buffer
  );

  console.log("saved -> result.png");

} else {

  const data = await res.json();
  console.log(data);

}`;
      }

      return `import fetch from "node-fetch";

const res = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(
    ${JSON.stringify(params, null, 2)}
  )
});

const data = await res.json();

console.log(data);`;
    },

    curl: (method, fullUrl) => {
      const { url, params } = buildSnippetData(method, fullUrl);
      const hasFile = document.querySelector('[data-type="file"]');

      if (method === "GET") {
        return `curl "${fullUrl}"`;
      }

      if (hasFile) {
        return `curl -X POST "${url}" \\
  -F "file=@image.jpg"
${Object.entries(params)
  .map(([k, v]) => `  -F "${k}=${v}"`)
  .join(" \\\n")}`;
      }

      return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(params)}'`;
    },

    python: (method, fullUrl) => {
      const { url, params } = buildSnippetData(method, fullUrl);

      const hasFile = document.querySelector('[data-type="file"]');

      if (method === "GET") {
        return `import requests

res = requests.get("${fullUrl}")

print(res.json())`;
      }

      if (hasFile) {
        return `import requests

files = {
  "file": open("image.jpg", "rb")
}

data = ${JSON.stringify(params, null, 2)}

res = requests.post(
  "${url}",
  files=files,
  data=data
)

content_type = res.headers.get(
  "content-type",
  ""
)

if content_type.startswith("image/"):

  with open("result.png", "wb") as f:
    f.write(res.content)

  print("saved -> result.png")

else:
  print(res.json())`;
      }

      return `import requests

res = requests.post(
  "${url}",
  json=${JSON.stringify(params, null, 2)}
)

print(res.json())`;
    },
  };
  snippetBox.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      snippetOutput.classList.remove("hidden");

      const code = snippets[btn.dataset.lang](
        elMethod.textContent,
        elFullUrl.value,
      );

      let lang = btn.dataset.lang;
      if (lang === "curl") lang = "bash";
      if (lang === "node") lang = "javascript";

      snippetOutput.innerHTML = `<code class="language-${lang}"></code>`;
      const codeEl = snippetOutput.querySelector("code");
      codeEl.textContent = code;

      Prism.highlightElement(codeEl);
    };
  });

  async function runEndpoint(group, item) {
    outputBox.innerHTML = "";
    loading.classList.remove("hidden");
    copyResultBtn.classList.add("hidden");
    copyResultBtn.textContent = "Copy";

    try {
      let url = BASE_DOMAIN + group.path;
      let options = { method: item.method, headers: {} };

      const params = {};
      document.querySelectorAll("[data-param]").forEach((el) => {
        if (el.type === "file") return; 
        if (!el.value) return;

        let val = el.value;
        if (el.dataset.type === "number") val = Number(val);
        if (el.dataset.type === "boolean") val = val === "true";
        if (el.dataset.type === "json") val = JSON.parse(val);

        params[el.dataset.param] = val;
      });

      let apiKey = null;
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.apikey) apiKey = user.apikey;
      } catch {}

      if (item.method === "GET") {
        if (apiKey) params.apikey = apiKey;
        const qs = Object.keys(params).length
          ? "?" + new URLSearchParams(params).toString()
          : "";
        url += qs;
      } else {
        const fileInputs = document.querySelectorAll(".file-input");

        let hasFile = false;
        fileInputs.forEach((input) => {
          if (input.files.length > 0) hasFile = true;
        });
        if (hasFile) {
          delete options.headers["Content-Type"];

          const formData = new FormData();

          document.querySelectorAll("[data-param]").forEach((el) => {
            if (el.dataset.type === "file") {
              if (el.files && el.files[0]) {
                formData.append(el.dataset.param, el.files[0]);
              }
            } else if (el.value) {
              formData.append(el.dataset.param, el.value);
            }
          });

          if (apiKey) options.headers["x-api-key"] = apiKey;
          options.body = formData;

          if (apiKey) formData.append("apikey", apiKey); 
          options.body = formData;
        } else {
          options.headers["Content-Type"] = "application/json";
          if (apiKey) options.headers["x-api-key"] = apiKey;
          options.body = JSON.stringify(params);
        }
      }
      const res = await fetch(url, options);
      if (res.status === 401 || res.status === 403) {
        playSound("denied");
      } else if (!res.ok) {
        playSound("error");
      }
      const contentType = res.headers.get("content-type") || "";

      if (contentType.startsWith("image/")) {
        const blob = await res.blob();
        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.className = "max-w-full rounded-lg border";
        outputBox.appendChild(img);
        return;
      }

      if (contentType.startsWith("audio/")) {
        const blob = await res.blob();
        const audio = document.createElement("audio");
        audio.src = URL.createObjectURL(blob);
        audio.controls = true;
        outputBox.appendChild(audio);
        return;
      }

      if (contentType.startsWith("video/")) {
        const blob = await res.blob();
        const video = document.createElement("video");
        video.src = URL.createObjectURL(blob);
        video.controls = true;
        outputBox.appendChild(video);
        return;
      }

      const text = await res.text();

      outputBox.textContent = "";
      copyResultBtn.classList.add("hidden");
      copyResultBtn.onclick = null;

      try {
        const json = JSON.parse(text);

        if (json.status === true) {
          playSound("success");
        } else if (json.status === false) {
          playSound("error");
        }
        const pretty = JSON.stringify(json, null, 2);
        outputBox.textContent = pretty;

        copyResultBtn.classList.remove("hidden");
        copyResultBtn.onclick = () => {
          navigator.clipboard.writeText(pretty);
          copyResultBtn.textContent = "Copied!";
          setTimeout(() => (copyResultBtn.textContent = "Copy"), 1200);
        };
      } catch {
        outputBox.textContent = text;

        if (text && text.trim()) {
          copyResultBtn.classList.remove("hidden");
          copyResultBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyResultBtn.textContent = "Copied!";
            setTimeout(() => (copyResultBtn.textContent = "Copy"), 1200);
          };
        }
      }
    } catch (e) {
      playSound("error");
      outputBox.textContent = "ERROR: " + e.message;
    } finally {
      loading.classList.add("hidden");
    }
  }

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(elFullUrl.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  };

  copyResultBtn.onclick = async () => {
    const text = outputBox.textContent;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      copyResultBtn.textContent = "Copied!";
      setTimeout(() => (copyResultBtn.textContent = "Copy"), 1200);
    } catch {
      alert("Gagal menyalin teks");
    }
  };

  closeBtn.onclick = () => modal.classList.add("hidden");

  loadEndpoints();
});
