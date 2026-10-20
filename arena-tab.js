const TABS = [
    { img: "../assets/tabs/051426_brainfuck_python.jpg", href: "https://www.are.na/block/51592679", alt: "brainfuck_python" },
    { img: "../assets/tabs/051426_piet_programming_language.jpg", href: "https://www.are.na/block/51592534", alt: "piet_programming_language" },
    { img: "../assets/tabs/051426_L-system.jpg", href: "https://www.are.na/block/51592634", alt: "L-systemd" },
    { img: "../assets/tabs/051426_metapod.jpeg", href: "https://www.are.na/block/51592276", alt: "metapod" },
    { img: "../assets/tabs/051426_dior_minimotard_clear.jpeg", href: "https://www.are.na/block/51592311", alt: "dior_minimotard_clear" },
    { img: "../assets/tabs/051426_palitos_de_yuca.jpg", href: "https://www.are.na/block/51593138", alt: "palitos_de_yuca" },
    { img: "../assets/tabs/101926_la_cabra_goat.jpg", href: "https://www.are.na/block/51596463", alt: "la_cabra_goat" },
    { img: "../assets/tabs/101926_bob_the_builder.jpg", href: "https://www.are.na/block/51596375", alt: "bob_the_builder" },
    { img: "../assets/tabs/083126_mojo_jojo_him.jpg", href: "https://www.are.na/block/51595456", alt: "mojo_jojo_him" },
    { img: "../assets/tabs/083126_horton_hears_a_who_jojo.jpg", href: "https://www.are.na/block/51595346", alt: "horton_hears_a_who_jojo" },
    { img: "../assets/tabs/063026_lawyer_sharks_teams.jpg", href: "https://www.are.na/block/51594450", alt: "lawyer_sharks_teams" },
    { img: "../assets/tabs/101926_after_eating_the_big_anchovie.jpg", href: "https://www.are.na/block/51596287", alt: "after_eating_the_big_anchovie" },
    { img: "../assets/tabs/063026_one_person_sauna.jpg", href: "https://www.are.na/block/51594756", alt: "one_person_sauna" },
    { img: "../assets/tabs/101926_everything_bagel.jpg", href: "https://www.are.na/block/51596502", alt: "everything_bagel" },
    { img: "../assets/tabs/051426_serendipity.jpg", href: "https://www.are.na/block/51592280", alt: "serendipity" },
    { img: "../assets/tabs/051426_perpetual_stew.jpg", href: "https://www.are.na/block/51592189", alt: "perpetual_stew" },
    { img: "../assets/tabs/051426_thagomizer.jpg", href: "https://www.are.na/block/51592045", alt: "thagomizer" },
];

// Where the link goes if a tab has no href of its own
const ARENA_CHANNEL_URL = "https://www.are.na/katelyn-lee-unuswwx3kie/open-tabs-rju7gn02xkq";

/* ---------- elements ---------- */

const tabCard = document.getElementById("arena-card");
const tabFrame = document.getElementById("arena-frame");

// "../assets/tabs/051426_metapod.jpeg" → "051426_metapod.jpeg"
function fileName(path) {
  try {
    return decodeURIComponent(path.split("/").pop());
  } catch {
    return path.split("/").pop();
  }
}

/* ---------- picking ---------- */

const LAST_KEY = "about-last-tab";
let current = -1;

// Remember the last one shown, so a refresh never repeats it
try {
  current = Number(localStorage.getItem(LAST_KEY) ?? -1);
} catch {
  current = -1;
}

function pickRandom() {
  if (TABS.length <= 1) return 0;
  let next;
  do {
    next = Math.floor(Math.random() * TABS.length);
  } while (next === current);
  return next;
}

function show(index) {
  const tab = TABS[index];
  if (!tab) return;
  current = index;

  try {
    localStorage.setItem(LAST_KEY, String(index));
  } catch {
    /* private mode etc. — fine */
  }

  const img = document.createElement("img");
  img.src = tab.img;
  img.alt = tab.alt || "";
  img.decoding = "async";
  tabFrame.classList.remove("is-text");
  tabFrame.replaceChildren(img);

  tabCard.href = tab.href || ARENA_CHANNEL_URL;

  if (tabNumber) {
    tabNumber.textContent = tab.alt || fileName(tab.img);
  }

  // Warm up the next one so the swap after a click is instant
  const upcoming = TABS[(index + 1) % TABS.length];
  if (upcoming) new Image().src = upcoming.img;
}

if (tabCard && tabFrame && TABS.length) {
  show(pickRandom());

  // The link opens this block on Are.na; swap in a new one behind it
  tabCard.addEventListener("click", () => {
    setTimeout(() => show(pickRandom()), 300);
  });
}