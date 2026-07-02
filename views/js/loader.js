const el = document.getElementById("decode");
const loader = document.getElementById("loader");

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const finalText = "RHNX-API";

let frame = 0;
let queue = [];

for (let i = 0; i < finalText.length; i++) {
  queue.push({
    from: chars[Math.floor(Math.random() * chars.length)],
    to: finalText[i],
    start: i * 6,
    end: i * 6 + 40,
    char: "",
  });
}

function update() {
  let output = "";
  let complete = 0;

  for (let i = 0; i < queue.length; i++) {
    let q = queue[i];

    if (frame >= q.end) {
      complete++;
      output += q.to;
    } else if (frame >= q.start) {
      if (!q.char || Math.random() < 0.3) {
        q.char = chars[Math.floor(Math.random() * chars.length)];
      }
      output += q.char;
    } else {
      output += " ";
    }
  }

  el.innerText = output;

  if (complete === queue.length) {
    setTimeout(() => {
      loader.classList.add("hide");
    }, 500);

    return;
  }

  frame++;
  requestAnimationFrame(update);
}

requestAnimationFrame(update);
