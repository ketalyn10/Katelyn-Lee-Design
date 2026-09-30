function prepareProjectDescriptionToggles() {
  const toggles = document.querySelectorAll(".project-toggle");

  toggles.forEach((toggle) => {
    const meta = toggle.closest(".project-meta, .related-project-meta");
    if (!meta) return;

    const description = meta.querySelector(
      ".project-description, .related-project-description"
    );

    if (!description) return;

    toggle.addEventListener("click", () => {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";

      toggle.setAttribute("aria-expanded", String(!isExpanded));
      toggle.setAttribute(
        "aria-label",
        isExpanded ? "Show project description" : "Hide project description"
      );

      description.hidden = isExpanded;
    });
  });
}

function prepareMiniCarousels() {
  const carousels = document.querySelectorAll(".mini-carousel");

  carousels.forEach((carousel) => {
    const slides = carousel.querySelectorAll(".mini-carousel-track > *");
    if (slides.length < 2) return;

    let current = 0;

    const show = (n) => {
      slides[current].classList.remove("is-active");
      current = (n + slides.length) % slides.length;
      slides[current].classList.add("is-active");
    };

    carousel.querySelector(".prev").addEventListener("click", () => show(current - 1));
    carousel.querySelector(".next").addEventListener("click", () => show(current + 1));
  });
}

prepareProjectDescriptionToggles();
prepareMiniCarousels();