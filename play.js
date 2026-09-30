const playProjects = {
  KLIO: {
    title: "Activity Log",
    year: "2026",
    description:
      "Various data visualization posters rendered via p5.js for Katelyn Lee is Online.",

    media: [
      {
        type: "image",
        src: "../assets/activitylog/poster_final.png",
        alt: "Activity log"
      },
      {
        type: "image",
        src: "../assets/activitylog/COVERS.png",
        alt: "Cover"
      },
      {
        type: "image",
        src: "../assets/activitylog/example.png",
        alt: "Cover"
      },
      {
        type: "image",
        src: "../assets/activitylog/example_2.png",
        alt: "Cover"
      },
      {
        type: "image",
        src: "../assets/activitylog/example_3.png",
        alt: "Cover"
      },
      {
        type: "image",
        src: "../assets/activitylog/example_4.png",
        alt: "Cover"
      },
      {
        type: "image",
        src: "../assets/activitylog/example_5.png",
        alt: "Cover"
      }
    ]
  },
  
  riso: {
    title: "Riso Animation + Flipbooks",
    year: "2025",
    description:
      "Blender animation rendered into a series of risograph-printed flipbooks.",

    media: [
      {
        type: "image",
        src: "../assets/play/nopink copy.gif",
        alt: "Animated risograph flipbook artwork"
      },
      {
        type: "image",
        src: "../assets/play/flipbookscan1.png",
        alt: "Scan of the risograph-printed flipbook"
      }
    ]
  },

  wienerschnitzel: {
    title: "The Wiener Dog Hall of Fame by Wienerschnitzel",
    year: "2023",
    description: `
      Entered in the <em>Social Good Campaign</em> category of the
      16th Annual Shorty Awards.
      <a
        href="https://shortyawards.com/16th/the-wiener-dog-hall-of-fame"
        target="_blank"
        rel="noopener noreferrer"
      >
        Read about it here.
      </a>
    `,

    media: [
      {
        type: "image",
        src: "../assets/play/WS_hof.png",
        alt: "Wienerschnitzel Wiener Dog Hall of Fame campaign"
      },
      {
        type: "image",
        src: "../assets/play/buddyblack.png",
        alt: "Wienerschnitzel Wiener Dog Hall of Fame campaign"
      },
      {
        type: "image",
        src: "../assets/play/pennylane.png",
        alt: "Wienerschnitzel Wiener Dog Hall of Fame campaign"
      },
      {
        type: "image",
        src: "../assets/play/finn.png",
        alt: "Wienerschnitzel Wiener Dog Hall of Fame campaign"
      },
      {
        type: "image",
        src: "../assets/play/princesssmoochygucci.png",
        alt: "Wienerschnitzel Wiener Dog Hall of Fame campaign"
      }
    ]
  },

  hyundai: {
    title: "Hyundai E-bike",
    year: "2023",
    description:
      "3D renders and designs for a Hyundai E-bike which were part of a proposed OOH campaign and brand strategy.",

    media: [
      {
        type: "image",
        src: "../assets/play/hyundaiebike.gif",
        alt: "Animated render of the Hyundai E-bike"
      }
    ]
  },

  blender: {
    title: "Blender Animations",
    year: "2024",
    description:
      "Various type in motion experiments created in Blender.",

    media: [
      {
        type: "image",
        src: "../assets/play/mantra_final copy.gif",
        alt: "Experimental Blender typography animation"
      },
      {
        type: "video",
        src: "../assets/play/0001-0060.mp4",
        alt: "Blender motion experiment"
      }
    ]
  },

  touchdesigner: {
    title: "TouchDesigner Experiment",
    year: "2025",
    description:
      "An interactive visual experiment exploring feedback, distortion, motion, and responsive image-making.",

    media: [
      {
        type: "video",
        src:
          "../assets/play/Screen Recording 2025-12-26 at 1.36.29 PM copy (2).mp4",
        alt: "TouchDesigner visual experiment"
      }
    ]
  },

};

const projectButtons = [
  ...document.querySelectorAll(".play-project-button")
];

const titleElement = document.getElementById("play-project-title");
const yearElement = document.getElementById("play-project-year");
const descriptionElement = document.getElementById(
  "play-project-description"
);

const mediaContainer = document.getElementById(
  "play-carousel-media"
);

const countElement = document.getElementById(
  "play-carousel-count"
);

const previousZone = document.getElementById(
  "play-carousel-previous"
);

const nextZone = document.getElementById(
  "play-carousel-next"
);

const previousButton = document.getElementById(
  "play-previous-button"
);

const nextButton = document.getElementById(
  "play-next-button"
);

const carouselCursor = document.querySelector(
  ".carousel-cursor"
);

function moveCarouselCursor(event) {
  if (!carouselCursor) return;

  carouselCursor.style.left = `${event.clientX}px`;
  carouselCursor.style.top = `${event.clientY}px`;
}

function showCarouselCursor(direction) {
  if (!carouselCursor) return;
  if (window.innerWidth <= 768) return;

  carouselCursor.textContent =
    direction === "left" ? "☜" : "☞";

  carouselCursor.classList.add("is-visible");
}

function hideCarouselCursor() {
  if (!carouselCursor) return;

  carouselCursor.classList.remove("is-visible");
}

let activeProjectKey = "KLIO";
let activeMediaIndex = 0;

function createMediaElement(media) {
  if (media.type === "video") {
    const video = document.createElement("video");

    video.src = media.src;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    video.setAttribute("aria-label", media.alt || "");
    video.setAttribute("preload", "metadata");

    if (media.fit) {
      video.dataset.fit = media.fit;
    }

    return video;
  }

  const image = document.createElement("img");

  image.src = media.src;
  image.alt = media.alt || "";

  if (media.fit) {
    image.dataset.fit = media.fit;
  }

  return image;
}

function updateCounter() {
  const project = playProjects[activeProjectKey];
  const total = project.media.length;

  countElement.textContent = `${activeMediaIndex + 1} / ${total}`;

  const hasMultipleMedia = total > 1;

  previousZone.hidden = !hasMultipleMedia;
  nextZone.hidden = !hasMultipleMedia;
  previousButton.hidden = !hasMultipleMedia;
  nextButton.hidden = !hasMultipleMedia;
}

function loadMedia() {
  hideCarouselCursor();

  const project = playProjects[activeProjectKey];
  const media = project.media[activeMediaIndex];

  mediaContainer.classList.add("is-loading");

  window.setTimeout(() => {
    const mediaElement = createMediaElement(media);

    mediaContainer.replaceChildren(mediaElement);
    updateCounter();

    requestAnimationFrame(() => {
      mediaContainer.classList.remove("is-loading");
    });
  }, 120);
}

function loadProject(projectKey) {
  const project = playProjects[projectKey];

  if (!project) {
    return;
  }

  hideCarouselCursor();

  activeProjectKey = projectKey;
  activeMediaIndex = 0;

  titleElement.textContent = project.title;
  yearElement.textContent = project.year;
  descriptionElement.innerHTML = project.description;

  projectButtons.forEach((button) => {
    const isActive = button.dataset.project === projectKey;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  loadMedia();

  /*
  Update the URL without reloading the page.
  Example: /play/#hyundai
  */
  history.replaceState(null, "", `#${projectKey}`);
}

function showNextMedia() {
  const project = playProjects[activeProjectKey];

  activeMediaIndex =
    (activeMediaIndex + 1) % project.media.length;

  loadMedia();
}

function showPreviousMedia() {
  const project = playProjects[activeProjectKey];

  activeMediaIndex =
    (activeMediaIndex - 1 + project.media.length) %
    project.media.length;

  loadMedia();
}

projectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loadProject(button.dataset.project);
  });
});

previousZone.addEventListener("click", showPreviousMedia);
nextZone.addEventListener("click", showNextMedia);

previousButton.addEventListener("click", showPreviousMedia);
nextButton.addEventListener("click", showNextMedia);

previousZone.addEventListener("mouseenter", () => {
  showCarouselCursor("left");
});

previousZone.addEventListener(
  "mousemove",
  moveCarouselCursor
);

previousZone.addEventListener(
  "mouseleave",
  hideCarouselCursor
);

nextZone.addEventListener("mouseenter", () => {
  showCarouselCursor("right");
});

nextZone.addEventListener(
  "mousemove",
  moveCarouselCursor
);

nextZone.addEventListener(
  "mouseleave",
  hideCarouselCursor
);

/* Keyboard navigation */
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    showPreviousMedia();
  }

  if (event.key === "ArrowRight") {
    showNextMedia();
  }
});

/* Load linked project hash, or default to Riso */
const requestedProject = window.location.hash.slice(1);

if (playProjects[requestedProject]) {
  loadProject(requestedProject);
} else {
  loadProject("KLIO");
}
