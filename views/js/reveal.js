const reveals = document.querySelectorAll(
  ".reveal, .reveal-left, .reveal-right,.reveal-up, .reveal-down, .reveal-zoom",
);

function revealOnScroll() {
  const windowHeight = window.innerHeight;

  reveals.forEach((el) => {
    const elementTop = el.getBoundingClientRect().top;
    const visiblePoint = 100;

    if (elementTop < windowHeight - visiblePoint) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);

window.addEventListener("load", revealOnScroll);
