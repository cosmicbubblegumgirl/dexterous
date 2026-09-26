import {
  types,
  regions,
  title,
  esc,
  artwork,
  api,
  multiplier,
  weaknesses,
  nickname,
} from "./lib/data.js";
import {
  store,
  init,
  save,
  authenticate,
  logout,
  download,
  importBackup,
} from "./lib/store.js";
const paths = {
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-2 6-6 2 2-6 6-2Z",
  box: "m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10",
  team: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m7-8a4 4 0 0 1 0 8m6 10v-2a4 4 0 0 0-3-3.87",
  go: "M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 0 1 18 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  journal:
    "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 3H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-14A2.5 2.5 0 0 1 6.5 3ZM8 7h8M8 11h6",
  spark: "m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8L12 3Z",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 5l2-2 3 2h6l3-2 3 3-2 3v6l2 3-3 3-3-2H9l-3 2-3-3 2-3V9L3 6Z",
  search: "m21 21-5-5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  close: "m6 6 12 12M6 18 18 6",
  shuffle: "m3 4 18 16m-4 0h4v-4M3 20 21 4m-4 0h4v4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  upload: "M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4",
  trophy:
    "M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8",
  chevron: "m9 5 7 7-7 7",
  volume: "m11 4-6 4H2v8h3l6 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  calendar: "M3 5h18v16H3V5Zm4-3v6m10-6v6M3 10h18",
  bolt: "m13 2-9 12h7l-1 8 10-12h-7l1-8",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z",
  copy: "M9 9h12v12H9V9ZM5 15H3V3h12v2",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  menu: "M4 6h16M4 12h16M4 18h16",
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n] || paths.spark}"/></svg>`;
const button = (text, action, primary = false, ico = "") =>
  `<button type="button" class="btn ${primary ? "primary" : ""}" data-action="${action}">${ico ? icon(ico) : ""}${text}</button>`;
const $ = (s) => document.querySelector(s);
let catalog = [],
  byId = new Map(),
  route = "discover",
  search = "",
  type = "",
  gen = "",
  rarity = "",
  sort = "number",
  limit = 24,
  layout = "grid",
  collectionFilter = "all",
  detailId = null,
  detailTab = "about",
  shiny = false,
  compares = [],
  quiz = null,
  installPrompt;
const navs = [
  ["discover", "compass", "Discover"],
  ["collection", "box", "My collection"],
  ["team", "team", "Team builder"],
  ["go", "go", "GO companion"],
  ["journal", "journal", "Field journal"],
  ["lab", "spark", "The lab"],
  ["settings", "settings", "My trainer"],
];
const catchEntries = () =>
  Object.entries(store.data.collection).filter(([, x]) => x.caught);
const entry = (id) => store.data.collection[id] || {};
const tagged = (name) => catalog.filter((p) => entry(p.id)[name]);
const date = () => new Date().toLocaleDateString("en-CA");
function toast(text) {
  $("#toast").innerHTML = `<div class="toast">${esc(text)}</div>`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").innerHTML = ""), 4000);
}
function prefs() {
  const p = store.data.preferences;
  document.body.classList.toggle("light", p.mode !== "dark");
  document.body.classList.toggle("dark", p.mode === "dark");
  document.body.classList.toggle("theme-meadow", p.theme === "meadow");
  document.body.classList.toggle("theme-sky", p.theme === "sky");
  document.body.classList.toggle("theme-peach", p.theme === "peach");
  document.body.classList.toggle("theme-lab", p.theme === "lab");
  document.body.classList.toggle("blue-light", p.blueLight);
  document.body.classList.toggle("large", p.font === "large");
  document.body.classList.toggle("reduce-motion", !p.motion);
  const themeColor =
    p.mode === "dark"
      ? { meadow: "#17211f", sky: "#182529", peach: "#29211e", lab: "#101a1d" }[
          p.theme
        ]
      : { meadow: "#f0f6ed", sky: "#edf6f8", peach: "#fbf1e9", lab: "#eaf5f2" }[
          p.theme
        ];
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
}
function badges() {
  const n = catchEntries().length;
  return [
    ["First field note", "Catch your first Pokémon.", n >= 1],
    ["Tiny army", "Collect 10 different species.", n >= 10],
    ["Pocket professor", "Collect 50 different species.", n >= 50],
    [
      "Sparkle department",
      "Mark your first shiny.",
      tagged("shiny").length > 0,
    ],
    ["Full house", "Build a team of six.", store.data.team.length === 6],
    [
      "Dear diary",
      "Write three journal entries.",
      store.data.journal.length >= 3,
    ],
  ];
}
function shell() {
  const name = store.data.profile.name || "Trainer";
  $("#app").innerHTML =
    `${!navigator.onLine ? '<div class="offline">Offline · your saved field guide is still here</div>' : ""}<div class="shell"><aside class="sidebar"><a href="#discover" class="brand"><img src="assets/logo.png" alt="Dexterous logo"><div>dexterous<small>THE CURIOUS FIELD GUIDE</small></div></a><nav aria-label="Main navigation">${navs.map(([id, i, label]) => `<a href="#${id}" class="nav ${route === id ? "active" : ""}" ${route === id ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span>${id === "collection" ? `<span class="count">${catchEntries().length}</span>` : ""}</a>`).join("")}</nav><div class="sidebar-bottom"><div class="aside-note"><strong>A little help from Dexter.</strong><p>Types, evolutions, and your next small adventure.</p><button data-action="chat" class="btn subtle">Ask Dexter ${icon("arrow")}</button></div><div class="credit">A Quantum Cupcake Creation<br>A little more discovery.</div></div></aside><div class="workspace"><header class="topbar"><div class="breadcrumb">Field guide <span>/ &nbsp; ${navs.find((n) => n[0] === route)?.[2] || "Discover"}</span></div><a href="#discover" class="mobile-brand brand"><img src="assets/logo.png" alt=""><div>dexterous<small>STAY CURIOUS.</small></div></a><div class="row"><button class="iconbtn" data-action="theme" aria-label="Toggle light and dark theme">${icon("sun")}</button><button class="account" data-action="account"><span class="avatar">${esc(name[0].toUpperCase())}</span><div>${esc(name)}<div class="status" id="save-status">${esc(store.status)}</div></div>${icon("chevron")}</button></div></header><main id="main" tabindex="-1"></main></div></div><nav class="mobile-nav" aria-label="Mobile navigation">${[navs[0], navs[1], navs[2], navs[3], navs[5]].map(([id, i, label]) => `<a href="#${id}" class="${route === id ? "active" : ""}" ${route === id ? 'aria-current="page"' : ""}>${icon(i)}${{ discover: "Discover", collection: "Collection", team: "Team", go: "GO", lab: "More" }[id]}</a>`).join("")}</nav><button class="assistant-toggle" data-action="chat" aria-label="Open Dexter assistant"><img src="assets/icon.svg" alt="">Dexter ${icon("spark")}</button>`;
  renderView();
  prefs();
  const asideNote = document.querySelector(".aside-note");
  if (asideNote)
    asideNote.innerHTML = `<strong>Take the scenic route.</strong><p>Meet a new favourite, check its region, or leave yourself a field note.</p>${button("Surprise me", "surprise", false, "shuffle")}`;
}
function heading(eyebrow, h, p = "", extra = "") {
  return `<div class="heading"><div><div class="eyebrow">${eyebrow}</div><h1 style="margin-top:8px">${h}</h1>${p ? `<p>${p}</p>` : ""}</div>${extra}</div>`;
}
function card(p) {
  const e = entry(p.id);
  return `<article class="poke-card ${p.types[0]}" style="--glow:color-mix(in srgb,var(--type) 15%,transparent)"><div class="card-top"><span>#${String(p.id).padStart(4, "0")}</span><button class="iconbtn ${e.favourite ? "selected" : ""}" data-action="fav" data-id="${p.id}" aria-label="${e.favourite ? "Unfavourite" : "Favourite"} ${title(p.name)}" aria-pressed="${!!e.favourite}">${icon("heart")}</button></div><button class="pokemon-open" data-action="open" data-id="${p.id}" aria-label="Open ${title(p.name)} details"><div class="art"><img src="${artwork(p.id, e.shiny)}" alt="${title(p.name)}${e.shiny ? " shiny" : ""}" loading="lazy" width="138" height="138"></div><h3>${title(p.name)}</h3><div class="types">${p.types.map((t) => `<span class="type ${t}">${t}</span>`).join("")}</div></button><div class="card-bottom"><button class="catch-btn ${e.caught ? "caught" : ""}" data-action="caught" data-id="${p.id}" aria-pressed="${!!e.caught}" aria-label="${e.caught ? "Unmark" : "Mark"} ${title(p.name)} as caught">${icon(e.caught ? "check" : "plus")}${e.caught ? "Caught" : "Add catch"}</button><span>${e.shiny ? "✧ Shiny" : regions[p.gen]}</span></div></article>`;
}
function filtered() {
  let list = catalog.filter(
    (p) =>
      (!type || p.types.includes(type)) &&
      (!gen || p.gen === +gen) &&
      (!rarity ||
        (rarity === "legendary"
          ? p.legendary
          : rarity === "mythical"
            ? p.mythical
            : p.base)),
  );
  const q = search.toLowerCase().trim();
  if (q)
    list = list.filter(
      (p) =>
        p.name.includes(q.replaceAll(" ", "-")) ||
        String(p.id) === q.replace("#", "") ||
        (entry(p.id).nickname || "").toLowerCase().includes(q),
    );
  if (route === "collection")
    list = list.filter((p) =>
      collectionFilter === "all"
        ? entry(p.id).caught
        : collectionFilter === "missing"
          ? !entry(p.id).caught
          : collectionFilter === "duplicates"
            ? entry(p.id).caught && (entry(p.id).count || 1) > 1
            : entry(p.id)[collectionFilter],
    );
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "strong")
    list.sort(
      (a, b) =>
        b.stats.reduce((s, n) => s + n, 0) - a.stats.reduce((s, n) => s + n, 0),
    );
  if (sort === "reverse") list.sort((a, b) => b.id - a.id);
  return list;
}
function catalogControls() {
  const regionsMarkup = regions
    .slice(1)
    .map(
      (region, index) =>
        `<option value="${index + 1}" ${+gen === index + 1 ? "selected" : ""}>${region}</option>`,
    )
    .join("");
  const rarityMarkup = [
    ["legendary", "Legendary"],
    ["mythical", "Mythical"],
    ["base", "First stages"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${rarity === value ? "selected" : ""}>${label}</option>`,
    )
    .join("");
  const sortMarkup = [
    ["number", "Pokédex number"],
    ["reverse", "Newest first"],
    ["name", "A to Z"],
    ["strong", "Base stat total"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${sort === value ? "selected" : ""}>${label}</option>`,
    )
    .join("");
  const typeMarkup = types
    .map(
      (kind) =>
        `<button class="chip ${type === kind ? "active" : ""}" data-action="type" data-value="${kind}">${title(kind)}</button>`,
    )
    .join("");
  return `<div class="filters"><label class="search"><span class="sr-only">Search Pokémon</span>${icon("search")}<input id="search" placeholder="Name, number, or nickname…" autocomplete="off" value="${esc(search)}"><span class="small muted">/</span></label><select id="region" aria-label="Region"><option value="">All regions</option>${regionsMarkup}</select><select id="rarity" aria-label="Rarity"><option value="">All species</option>${rarityMarkup}</select><select id="sort" aria-label="Sort Pokémon">${sortMarkup}</select></div><div class="type-filters" role="group" aria-label="Filter by type"><button class="chip ${!type ? "active" : ""}" data-action="type" data-value="">All types</button>${typeMarkup}</div><div class="catalog-meta"><span id="result-count"></span><div class="row"><button class="iconbtn ${layout === "grid" ? "selected" : ""}" data-action="layout" data-value="grid" aria-label="Grid view">${icon("grid")}</button><button class="iconbtn ${layout === "list" ? "selected" : ""}" data-action="layout" data-value="list" aria-label="List view">${icon("list")}</button></div></div><div class="catalog ${layout === "list" ? "list" : ""}" id="catalog"></div><div class="load-more" id="load-more"></div>`;
}
function renderCatalog() {
  const list = filtered();
  const count = $("#result-count");
  if (!count) return;
  count.textContent = `${list.length.toLocaleString()} Pokémon · ${type ? title(type) : "Every type of curious"}`;
  $("#catalog").innerHTML = list.length
    ? list.slice(0, limit).map(card).join("")
    : `<div class="empty">${icon("compass")}<h3>${route === "collection" ? "Your next discovery starts here." : "No Pokémon in this patch."}</h3><p>${route === "collection" ? "Add catches or favourites from Discover. Your collection saves as you go." : "Try a different name or clear your filters."}</p>${button(route === "collection" ? "Explore the Pokédex" : "Clear filters", route === "collection" ? "discover" : "clear", true)}</div>`;
  $("#load-more").innerHTML =
    list.length > limit
      ? button(`Show 24 more · ${list.length - limit} remaining`, "more")
      : "";
}
function discover() {
  const featured = byId.get(1);
  const hero = `<div class="feature-row"><section class="spotlight"><div class="spotlight-text"><div class="eyebrow">A FIRST LITTLE FAVOURITE</div><h2>${title(featured.name)} says hello.</h2><p>A little plant friend to start the trip.</p><button class="btn" data-action="open" data-id="${featured.id}">Meet ${title(featured.name)} ${icon("arrow")}</button></div><img src="${artwork(featured.id)}" alt="${title(featured.name)}"></section><section class="mission"><div class="eyebrow">TODAY’S FIELD NOTE</div><h3>Leave room for a favourite.</h3><p>Pick a region, wander through its entries, and save the ones that make you smile.</p><div class="row">${button("Open the field journal", "journal", false, "journal")}</div></section></div>`;
  $("#main").innerHTML =
    heading(
      "KANTO TO PALDEA · 1,025 FIELD NOTES",
      "A little more discovery.",
      "Browse every species in the National Pokédex, one happy surprise at a time.",
      button("Surprise me", "surprise", true, "shuffle"),
    ) +
    hero +
    catalogControls();
  renderCatalog();
}
function collection() {
  const caught = catchEntries().length;
  const progress = Math.round((caught / catalog.length) * 100);
  const quickFilters = [
    ["all", "Caught"],
    ["missing", "Still to find"],
    ["favourite", "Favourites"],
    ["wishlist", "Wishlist"],
    ["duplicates", "Duplicates"],
    ["trade", "For trade"],
  ]
    .map(
      ([value, label]) =>
        `<button class="chip ${collectionFilter === value ? "active" : ""}" data-action="collection-filter" data-value="${value}">${label}</button>`,
    )
    .join("");
  const favourites = tagged("favourite")
    .slice(0, 8)
    .map(
      (pokemon) =>
        `<button data-action="open" data-id="${pokemon.id}"><img src="${artwork(pokemon.id, entry(pokemon.id).shiny)}" alt="${title(pokemon.name)}"><span>${title(pokemon.name)}</span></button>`,
    )
    .join("");
  $("#main").innerHTML =
    heading(
      "YOUR LITTLE CORNER OF THE POKÉDEX",
      "My collection.",
      `${caught.toLocaleString()} of ${catalog.length.toLocaleString()} species · ${progress}% explored.`,
      button("Share collection", "share", false, "link"),
    ) +
    `<div class="row space">${quickFilters}</div><div class="space">${catalogControls()}</div><section class="panel space"><div class="row between"><h3>Your display shelf</h3>${button("Trainer Wrapped", "wrapped", false, "spark")}</div><div class="shelf">${favourites || '<p class="muted">Your favourites will take pride of place here.</p>'}</div></section>`;
  renderCatalog();
}
function teamView() {
  const ps = store.data.team.map((id) => byId.get(id)).filter(Boolean);
  const danger = types
    .map((kind) => ({
      type: kind,
      count: ps.filter((pokemon) => multiplier(kind, pokemon.types) > 1).length,
    }))
    .filter((matchup) => matchup.count >= 2);
  const slots = Array.from({ length: 6 }, (_, index) => {
    const pokemon = ps[index];
    return pokemon
      ? `<div class="team-slot"><button class="iconbtn" data-action="team-remove" data-id="${pokemon.id}" aria-label="Remove ${title(pokemon.name)} from team">${icon("close")}</button><img src="${artwork(pokemon.id)}" alt="${title(pokemon.name)}"><h3>${title(pokemon.name)}</h3><div class="types">${pokemon.types.map((kind) => `<span class="type ${kind}">${kind}</span>`).join("")}</div></div>`
      : `<button class="team-slot empty-slot" data-action="team-picker">${icon("plus")}Choose a teammate</button>`;
  }).join("");
  const weaknessesMarkup = danger
    .map(
      (matchup) =>
        `<span class="type ${matchup.type}">${title(matchup.type)} · ${matchup.count} weak</span>`,
    )
    .join("");
  $("#main").innerHTML =
    heading(
      "SIX SLOTS. MANY POSSIBILITIES.",
      "Build your little dream team.",
      "Explore type coverage using main-series type matchups.",
      button("Type chart", "type-chart", false, "grid"),
    ) +
    `<div class="team-grid">${slots}</div><div class="grid2"><section class="panel"><div class="eyebrow">DEFENSIVE COVERAGE</div><h2 class="space">Every team has a soft spot.</h2><p class="muted small space">${ps.length ? (danger.length ? "These attack types are super effective against two or more teammates." : "No shared weaknesses across two teammates yet.") : "Add Pokémon to see shared weaknesses."}</p><div class="row space">${weaknessesMarkup}</div><p class="small muted space">Type coverage is a starting point. Moves, abilities, levels, and battle format also matter.</p></section><section class="panel"><div class="eyebrow">TEAM TOOLKIT</div><h2 class="space">A second opinion?</h2><p class="muted small space">Compare base stats or review shared type weaknesses.</p><div class="row space">${button("Compare team", "compare-team", true)}${button("Open type chart", "type-chart")}</div></section></div>`;
}
function goView() {
  const go = catchEntries().filter(([, e]) => e.source === "go");
  const tasks = [
    "Charge phone and battery pack",
    "Check bag and Pokémon storage",
    "Choose a buddy",
    "Pack water",
    "Check official event details",
  ];
  $("#main").innerHTML =
    heading(
      "OUTSIDE IS CALLING",
      "The GO companion.",
      "Plan your next outing, one tiny adventure at a time.",
    ) +
    `<div class="note"><strong>Personal GO tracker</strong> · Entries are added by you or imported from your own CSV. Dexterous does not connect to your Pokémon GO account or read live catches.</div><div class="stats-row space">${[
      [go.length, "GO species logged"],
      [go.filter(([, e]) => e.shiny).length, "GO shinies"],
      [tagged("trade").length, "Trade wishlist entries"],
      [
        store.data.journal
          .reduce((n, j) => n + (+j.distance || 0), 0)
          .toFixed(1) + " km",
        "Walks you logged",
      ],
    ]
      .map(
        ([v, l]) =>
          `<div class="stat"><strong>${v}</strong><span>${l}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="grid2"><section class="panel"><div class="eyebrow">BEFORE YOU GO</div><h2 class="space">Adventure checklist</h2><div class="space">${tasks.map((t, i) => `<div class="goal"><label class="check"><input type="checkbox" data-check="go-${i}" ${store.data.checks["go-" + i] ? "checked" : ""}>${t}</label></div>`).join("")}</div><div class="row space">${button("Reset checklist", "reset-checks")}${button("Add calendar reminder", "calendar", false, "calendar")}</div></section><section class="panel"><div class="eyebrow">YOUR WALKING COMPANION</div><h2 class="space">Buddy business.</h2><div class="row space"><img src="${artwork(store.data.profile.buddy)}" alt="Your chosen buddy" width="110" height="110" style="object-fit:contain"><div><h3>${title(byId.get(store.data.profile.buddy)?.name || "Pikachu")}</h3><p class="muted small">One foot in front of the other.</p>${button("Choose buddy", "buddy-picker")}</div></div><div class="row space">${button("Log a walk", "journal-new", true)}${button("Import GO CSV", "go-import", false, "upload")}</div></section><section class="panel"><h2>Trade wishlists</h2><p class="muted small space">Mark Pokémon “For trade” or “Wishlist” in their collection details. Share a list when you are ready.</p><div class="row space">${button("View wishlist", "wishlist")}${button("Share trade list", "share-trades")}</div></section><section class="panel"><h2>Transfer to Pokémon HOME</h2><p class="muted small space">Transfers from GO to HOME are one-way. Check eligibility in the official app before transferring.</p><a class="btn space" href="https://support.pokemon.com/hc/en-us/articles/360050219032-How-to-transfer-Pok%C3%A9mon-from-Pok%C3%A9mon-GO-to-Pok%C3%A9mon-HOME" target="_blank" rel="noopener">Official transfer guide ${icon("arrow")}</a><a class="btn space" href="https://pokemongolive.com/events" target="_blank" rel="noopener">Official GO events ${icon("arrow")}</a></section></div><section class="panel space"><h2>Evolution goals</h2><p class="muted small space">Keep your candy, item, or walking goals here. For example: “Eevee — collect 25 candy”.</p>${goalsMarkup("go")}</section>`;
}
function labView() {
  const milestones = badges()
    .map(
      ([name, description, earned]) =>
        `<div class="goal ${earned ? "done" : ""}"><span>${earned ? "✓" : "○"}</span><div><strong>${esc(name)}</strong><p class="small muted">${esc(description)}</p></div></div>`,
    )
    .join("");
  $("#main").innerHTML =
    heading(
      "ODDMENTS, QUIZZES & FIELD NOTES",
      "The little lab.",
      "A few playful ways to explore what you have found.",
    ) +
    `<div class="grid2"><section class="panel"><div class="eyebrow">A QUICK FIELD TEST</div><h2 class="space">Type something surprising.</h2><p class="muted small space">Check attack matchups across all eighteen types.</p><div class="row space">${button("Open type chart", "type-chart", true, "grid")}${button("Start a five-question quiz", "quiz", false, "spark")}</div></section><section class="panel"><div class="eyebrow">YOUR ADVENTURE, IN A NUTSHELL</div><h2 class="space">Little milestones.</h2><div class="stack space">${milestones}</div><div class="row space">${button("Trainer Wrapped", "wrapped", false, "trophy")}${button("Find my trainer style", "personality", false, "spark")}</div></section></div>`;
}
function goalsMarkup() {
  return `<div>${store.data.goals.map((g) => `<div class="goal ${g.done ? "done" : ""}"><label class="check"><input type="checkbox" data-goal="${g.id}" ${g.done ? "checked" : ""}>${esc(g.text)}</label><button class="iconbtn" data-action="goal-delete" data-value="${g.id}" aria-label="Delete goal">${icon("trash")}</button></div>`).join("")}</div><form class="goal-form" id="goal-form"><input name="goal" placeholder="One small goal…" aria-label="New goal" maxlength="200" required><button class="btn primary">Add goal ${icon("plus")}</button></form>`;
}
function journalView() {
  $("#main").innerHTML =
    heading(
      "POSTCARDS FROM THE TALL GRASS",
      "Your field journal.",
      "The catches, the walks, the “you had to be there” moments.",
      button("<span>New entry</span>", "journal-new", true, "plus"),
    ) +
    `<div class="grid2"><section class="panel"><h2>Small quests</h2>${goalsMarkup()}</section><section class="panel"><h2>Your catch calendar</h2><p class="muted small space">${catchEntries().filter(([, x]) => x.date === date()).length} species logged today.</p><div class="row space">${Array.from(
      { length: 14 },
      (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 13 + i);
        const ds = d.toLocaleDateString("en-CA"),
          n = catchEntries().filter(([, x]) => x.date === ds).length;
        return `<span class="pill" title="${ds}: ${n} species" style="opacity:${n ? 1 : 0.45}">${d.getDate()}${n ? " · " + n : ""}</span>`;
      },
    ).join(
      "",
    )}</div><p class="muted small space">Dates come from your saved catch notes. No streak pressure here.</p></section></div><div class="journal-list">${
      store.data.journal.length
        ? store.data.journal
            .slice()
            .reverse()
            .map(
              (j) =>
                `<article class="journal-entry"><div class="row between"><div><small>${esc(j.date)}${j.distance ? " · " + Number(j.distance) + " km" : ""}</small><h3>${esc(j.title)}</h3></div><button class="iconbtn" data-action="journal-delete" data-value="${j.id}" aria-label="Delete journal entry">${icon("trash")}</button></div><p>${esc(j.body)}</p></article>`,
            )
            .join("")
        : `<div class="empty">${icon("journal")}<h3>Every adventure deserves a footnote.</h3><p>Your journal is ready for its first entry.</p>${button("Write something", "journal-new", true)}</div>`
    }</div>`;
}
function settingsView() {
  const profile = store.data.profile;
  const preferences = store.data.preferences;
  const paletteOptions = [
    ["meadow", "Meadow mint"],
    ["sky", "Cloudy sky"],
    ["peach", "Peach picnic"],
    ["lab", "Professor's teal lab"],
  ];
  const teamOptions = ["Instinct", "Mystic", "Valor", "Still deciding"];
  const accountCopy = store.session
    ? `Signed in as ${esc(store.session.user.name)}. Your collection syncs to your account.`
    : "Guest collection: saved in this browser. Export a backup before switching devices or clearing browser data.";
  const cloudNote = store.backend
    ? "Account storage is ready on this backend. Sign in to sync between devices."
    : "Cloud storage is unavailable right now. Your guest collection remains saved on this device.";
  $("#main").innerHTML =
    heading("MAKE YOURSELF AT HOME", "Your trainer space.", "A field guide that feels like yours.") +
    `<div class="grid2"><section class="panel"><h2>Trainer card</h2><form id="profile-form" class="stack space"><label>Trainer name<input name="name" value="${esc(profile.name)}" maxlength="50" required></label><label>A little about you<textarea name="bio" maxlength="200">${esc(profile.bio)}</textarea></label><label>GO friend code (optional)<input name="friendCode" inputmode="numeric" placeholder="0000 0000 0000" value="${esc(profile.friendCode)}" maxlength="20"></label><label>Team colour<select name="team">${teamOptions.map((team) => `<option ${team === profile.team ? "selected" : ""}>${team}</option>`).join("")}</select></label><button class="btn primary">Save trainer card</button></form></section><section class="panel"><h2>Comfort settings</h2><div class="stack space"><label>Field guide palette<select id="pref-theme">${paletteOptions.map(([value, label]) => `<option value="${value}" ${preferences.theme === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><div><span class="setting-label">Display mode</span><div class="mode-toggle" role="group" aria-label="Display mode"><button type="button" class="btn ${preferences.mode !== "dark" ? "primary" : ""}" data-action="mode" data-value="light" aria-pressed="${preferences.mode !== "dark"}">Light</button><button type="button" class="btn ${preferences.mode === "dark" ? "primary" : ""}" data-action="mode" data-value="dark" aria-pressed="${preferences.mode === "dark"}">Dark</button></div></div><label class="check"><input type="checkbox" id="pref-blue-light" ${preferences.blueLight ? "checked" : ""}>Blue-light filter</label><label>Text size<select id="pref-font"><option value="normal" ${preferences.font !== "large" ? "selected" : ""}>Comfortable</option><option value="large" ${preferences.font === "large" ? "selected" : ""}>Larger</option></select></label><label class="check"><input type="checkbox" id="pref-motion" ${preferences.motion ? "checked" : ""}>Gentle animations</label><div class="divider"></div><h3>Account &amp; storage</h3><p class="small muted">${accountCopy}</p><p class="note">${cloudNote}</p>${button(store.session ? "Sign out" : "Log in / Sign up", store.session ? "logout" : "auth", true)}<div class="row">${button("Export backup", "export", false, "download")}${button("Import backup", "import", false, "upload")}${installPrompt ? button("Install app", "install") : ""}</div></div></section></div>`;
}
function renderView() {
  const view = ({
    discover,
    collection,
    team: teamView,
    go: goView,
    journal: journalView,
    lab: labView,
    settings: settingsView,
  })[route] || discover;
  view();
}
function navigate(id) {
  location.hash = id;
}
let returnFocus;
function modal(content, narrow = false) {
  returnFocus = document.activeElement;
  $("#overlay").innerHTML = `<div class="modal-backdrop"><section class="modal ${narrow ? "narrow" : ""}" role="dialog" aria-modal="true" aria-label="${detailId ? title(byId.get(detailId)?.name) : "Field guide dialog"}"><button class="iconbtn modal-close" data-action="close" aria-label="Close dialog">${icon("close")}</button>${content}</section></div>`;
  document.body.classList.add("modal-open");
  $(".modal-close").focus();
}
function closeModal() {
  detailId = null;
  $("#overlay").innerHTML = "";
  document.body.classList.remove("modal-open");
  if (returnFocus?.isConnected) returnFocus.focus();
}
async function openDetail(id, keep = false) {
  detailId = +id;
  if (!keep) {
    detailTab = "about";
    shiny = false;
  }
  const p = byId.get(detailId);
  if (!p) return;
  const e = entry(p.id);
  const depth = (x) =>
    x.parent && byId.has(x.parent) ? 1 + depth(byId.get(x.parent)) : 0;
  const family = catalog
    .filter((x) => x.chain === p.chain)
    .sort((a, b) => depth(a) - depth(b));
  let inner = "";
  if (detailTab === "about")
    inner = `<div class="detail-info"><div><span>HEIGHT</span><strong>${p.height} m</strong></div><div><span>WEIGHT</span><strong>${p.weight} kg</strong></div><div><span>REGION</span><strong>${regions[p.gen]}</strong></div></div><p class="muted small" id="flavour">${p.legendary ? "A legendary discovery." : p.mythical ? "A mythical discovery." : "Getting the field notes…"}</p><div class="bars">${["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"].map((s, i) => `<div class="bar"><span>${s}</span><div class="progress"><i style="width:${(p.stats[i] / 255) * 100}%"></i></div><strong>${p.stats[i]}</strong></div>`).join("")}</div><div class="row between small"><span class="muted">MAIN-SERIES BASE STAT TOTAL</span><strong>${p.stats.reduce((a, b) => a + b, 0)}</strong></div><h3 class="space">Watch out for</h3><div class="row space">${weaknesses(
      p,
    )
      .map((x) => `<span class="type ${x.type}">${x.type} ×${x.m}</span>`)
      .join("")}</div><div id="abilities" class="space small muted"></div>`;
  if (detailTab === "evolution")
    inner = `<h3>The family album</h3><p class="small muted space">Main-series evolution family. GO requirements can differ.</p><div class="evolutions">${family.map((x) => `<button class="evolution" data-action="open" data-id="${x.id}"><img src="${artwork(x.id)}" alt="${title(x.name)}"><span>${title(x.name)}</span>${entry(x.id).caught ? "<small>✓ Caught</small>" : "<small>Still to find</small>"}</button>`).join("")}</div><div id="evolution-notes" class="note">Loading evolution conditions…</div><div id="forms" class="row space"></div>`;
  if (detailTab === "notes")
    inner = `<div class="flag-grid">${[
      ["caught", "Caught"],
      ["seen", "Seen"],
      ["shiny", "Shiny"],
      ["lucky", "Lucky"],
      ["favourite", "Favourite"],
      ["wishlist", "Wishlist"],
      ["trade", "For trade"],
      ["chaos", "Chaos box"],
    ]
      .map(
        ([v, l]) =>
          `<button class="flag ${e[v] ? "on" : ""}" data-action="flag" data-value="${v}" data-id="${p.id}" aria-pressed="${!!e[v]}">${e[v] ? "✓ " : ""}${l}</button>`,
      )
      .join(
        "",
      )}</div><form id="notes-form" class="form-grid" data-id="${p.id}"><label>Nickname<div class="row"><input style="width:100%" name="nickname" value="${esc(e.nickname || "")}" maxlength="80"><button type="button" class="btn" data-action="nickname" data-id="${p.id}">Name this little menace ${icon("shuffle")}</button></div></label><label>Collection<select name="source"><option value="main" ${e.source !== "go" ? "selected" : ""}>Main series / general</option><option value="go" ${e.source === "go" ? "selected" : ""}>Pokémon GO</option></select></label><label>Catch date<input name="date" type="date" value="${esc(e.date || "")}"></label><label>Number owned<input type="number" name="count" min="1" max="999" value="${e.count || 1}"></label><label>Catch location (optional)<input name="location" value="${esc(e.location || "")}" maxlength="100" placeholder="A park, a city, a memory…"></label><label>Tags<input name="tags" value="${esc(e.tags || "")}" maxlength="200" placeholder="tiny menace, evolve, raid"></label><label class="full">Field notes<textarea name="note" maxlength="1000">${esc(e.note || "")}</textarea></label><button class="btn primary full">Save notes</button></form>`;
  modal(
    `<div class="modal-header"><span class="eyebrow">FIELD ENTRY · #${String(p.id).padStart(4, "0")}</span></div><div class="detail-hero"><div class="detail-art"><img id="detail-image" src="${artwork(p.id, shiny)}" alt="${title(p.name)}${shiny ? " shiny" : ""}"></div><div><span class="eyebrow">${p.legendary ? "LEGENDARY" : p.mythical ? "MYTHICAL" : "STAY CURIOUS"}</span><h2>${title(p.name)}</h2><div class="types">${p.types.map((t) => `<span class="type ${t}">${t}</span>`).join("")}</div><div class="row space">${button(shiny ? "Regular colours" : "Shiny preview", "shiny", false, "spark")}<button class="iconbtn" data-action="speak" data-id="${p.id}" aria-label="Read name aloud">${icon("volume")}</button></div><div class="row space"><button class="btn primary" data-action="team-add" data-id="${p.id}">${icon("plus")}Add to team</button><button class="btn" data-action="compare-add" data-id="${p.id}">Compare</button></div></div></div><div class="detail-tabs" role="group" aria-label="Pokémon details">${[
      ["about", "Overview"],
      ["evolution", "Evolutions"],
      ["notes", "My collection"],
    ]
      .map(
        ([v, l]) =>
          `<button class="btn ${detailTab === v ? "primary" : ""}" data-action="detail-tab" data-value="${v}">${l}</button>`,
      )
      .join("")}</div>${inner}`,
  );
  if (detailTab === "about" || detailTab === "evolution") {
    const current = p.id,
      tab = detailTab;
    try {
      const [species, pk] = await Promise.all([
        api(`pokemon-species/${p.id}`),
        api(`pokemon/${p.id}`),
      ]);
      if (detailId !== current || detailTab !== tab) return;
      if (tab === "about") {
        $("#flavour").textContent =
          species.flavor_text_entries
            .find((x) => x.language.name === "en")
            ?.flavor_text.replace(/[\n\f]/g, " ") ||
          "A new discovery for your field guide.";
        $("#abilities").textContent =
          "Abilities: " +
          pk.abilities
            .map(
              (x) => title(x.ability.name) + (x.is_hidden ? " (hidden)" : ""),
            )
            .join(" · ");
      } else {
        const chain = await api(species.evolution_chain.url);
        if (detailId !== current || detailTab !== tab) return;
        const lines = [];
        function walk(node) {
          for (const x of node.evolves_to) {
            const rules = x.evolution_details
              .map(
                (d) =>
                  [
                    d.min_level ? "level " + d.min_level : "",
                    d.item ? "use " + title(d.item.name) : "",
                    d.held_item ? "holding " + title(d.held_item.name) : "",
                    d.min_happiness ? "high friendship" : "",
                    d.time_of_day ? d.time_of_day : "",
                    d.trigger?.name === "trade" ? "trade" : "",
                    d.known_move ? "knowing " + title(d.known_move.name) : "",
                    d.location ? "at " + title(d.location.name) : "",
                    d.min_beauty ? "high beauty" : "",
                    d.min_affection ? "high affection" : "",
                    d.needs_overworld_rain ? "rainy overworld" : "",
                    d.turn_upside_down ? "turn device upside down" : "",
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                  title(d.trigger?.name || "special condition"),
              )
              .join(" OR ");
            lines.push(
              `${title(node.species.name)} → ${title(x.species.name)}: ${rules}`,
            );
            walk(x);
          }
        }
        walk(chain.chain);
        $("#evolution-notes").innerHTML = lines.length
          ? lines.map((x) => `<p>${esc(x)}</p>`).join("")
          : "No further evolution is recorded.";
        $("#forms").innerHTML =
          species.varieties.length > 1
            ? `<p class="muted small">Alternate forms: ${species.varieties
                .filter((x) => !x.is_default)
                .map((x) => esc(title(x.pokemon.name)))
                .join(" · ")}</p>`
            : "";
      }
    } catch {
      if (detailId === current && detailTab === tab) {
        const el = tab === "about" ? $("#flavour") : $("#evolution-notes");
        if (el)
          el.textContent =
            "Live notes are unavailable right now. The saved stats and family entries above still work.";
      }
    }
  }
}
function mutateFlag(id, key) {
  const e = { ...entry(id) };
  e[key] = !e[key];
  if (key === "caught" && e.caught) {
    e.seen = true;
    e.date = e.date || date();
    e.count = e.count || 1;
  }
  store.data.collection[id] = e;
  save();
  if (detailId) openDetail(detailId, true);
  else if (route === "collection") renderView();
  else if (route === "discover") renderCatalog();
  const count = document.querySelector(".nav .count");
  if (count) count.textContent = catchEntries().length;
}
function picker(purpose) {
  detailId = null;
  modal(
    `<div class="modal-header"><h2>${purpose === "buddy" ? "Choose your buddy" : purpose === "compare" ? "Compare Pokémon" : "Choose a teammate"}</h2></div><label class="search">${icon("search")}<input id="picker-search" placeholder="Search Pokémon…" aria-label="Find Pokémon" data-purpose="${purpose}"></label><div id="picker-results" class="evolutions">${pickerResults("", purpose)}</div>`,
  );
}
function pickerResults(q, purpose) {
  return catalog
    .filter(
      (p) =>
        p.name.includes(q.toLowerCase().replaceAll(" ", "-")) ||
        String(p.id) === q,
    )
    .slice(0, 12)
    .map(
      (p) =>
        `<button class="evolution" data-action="pick-${purpose}" data-id="${p.id}"><img src="${artwork(p.id)}" alt="" loading="lazy"><span>${title(p.name)}</span></button>`,
    )
    .join("");
}
function compareView(ids = compares) {
  const ps = ids.map((id) => byId.get(id)).filter(Boolean);
  modal(
    `<div class="modal-header"><h2>A closer look</h2></div><p class="small muted">Main-series base stats. Higher is not always better for every format.</p><div class="comparison space"><table><thead><tr><th>Pokémon</th>${ps.map((p) => `<th><img src="${artwork(p.id)}" alt="">${title(p.name)}</th>`).join("")}</tr></thead><tbody>${["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed", "Total"].map((s, i) => `<tr><td>${s}</td>${ps.map((p) => `<td>${i === 6 ? p.stats.reduce((a, b) => a + b, 0) : p.stats[i]}</td>`).join("")}</tr>`).join("")}<tr><td>Type</td>${ps.map((p) => `<td>${p.types.map(title).join(" / ")}</td>`).join("")}</tr></tbody></table></div><div class="row space">${button("Add another", "compare-picker", true)}${button("Clear comparison", "compare-clear")}</div>`,
  );
}
function journalModal() {
  detailId = null;
  modal(
    `<div class="modal-header"><h2>A note from the field</h2></div><form id="journal-form" class="stack"><label>Title<input name="title" required maxlength="100" placeholder="The day I found my tiny menace"></label><div class="form-grid"><label>Date<input name="date" type="date" value="${date()}" required></label><label>Walking distance, km (optional)<input name="distance" type="number" min="0" max="500" step="0.1" placeholder="0.0"></label></div><label>Your story<textarea name="body" required maxlength="3000" placeholder="The catch, the place, the ridiculous nickname…"></textarea></label><button class="btn primary">Save field note</button></form>`,
  );
}
function quizStart() {
  quiz = { index: 0, score: 0, answered: false, p: null, options: [] };
  quizRound();
}
function quizRound() {
  const shuffled = catalog
    .filter((p) => p.gen <= 3)
    .sort(() => Math.random() - 0.5);
  quiz.p = shuffled[0];
  quiz.options = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);
  quiz.answered = false;
  quizDraw();
}
function quizDraw(message = "") {
  modal(
    `<div class="modal-header"><span class="eyebrow">QUESTION ${quiz.index + 1} / 5 · SCORE ${quiz.score}</span></div><div class="quiz"><h2>Who’s that Pokémon?</h2><img src="${artwork(quiz.p.id)}" alt="${quiz.answered ? title(quiz.p.name) : "Mystery Pokémon silhouette"}" class="${quiz.answered ? "revealed" : ""}"><div class="quiz-options">${quiz.options.map((p) => `<button class="btn ${quiz.answered && p.id === quiz.p.id ? "primary" : ""}" data-action="quiz-answer" data-id="${p.id}" ${quiz.answered ? "disabled" : ""}>${title(p.name)}</button>`).join("")}</div>${message ? `<p class="space">${message}</p>${button(quiz.index === 4 ? "See my score" : "Next Pokémon", "quiz-next", true, "arrow")}` : ""}</div>`,
  );
}
function typeChart() {
  modal(
    `<div class="modal-header"><h2>Type matchup cheat sheet</h2></div><p class="small muted">Read attack types down the left, defending types across the top. ×2 is super effective; ×½ is resisted; ×0 is immune. Main-series chart.</p><div class="scroll-table space"><table class="type-table"><thead><tr><th>Attack ↓</th>${types.map((t) => `<th>${title(t).slice(0, 3)}</th>`).join("")}</tr></thead><tbody>${types
      .map(
        (t) =>
          `<tr><th>${title(t)}</th>${types
            .map((d) => {
              const m = multiplier(t, [d]);
              return `<td class="${m === 2 ? "effect-2" : m === 0 ? "effect-0" : m === 0.5 ? "effect-half" : ""}">${m === 0.5 ? "½" : m === 1 ? "·" : m}</td>`;
            })
            .join("")}</tr>`,
      )
      .join("")}</tbody></table></div>`,
  );
}
function authModal(mode = "login") {
  detailId = null;
  modal(
    `<div class="modal-header"><h2>${mode === "signup" ? "Join the field club." : mode === "recover" ? "Find your way back." : "Welcome back, trainer."}</h2></div>${!store.backend ? `<div class="note"><strong>Cloud accounts need one more setup step.</strong><p class="space">The backend has not been activated yet. You can explore, save a guest collection, and export a backup now.</p></div><div class="row space">${button("Keep exploring", "close", true)}${button("Export my collection", "export")}</div>` : `<form id="auth-form" class="stack" data-mode="${mode}">${mode === "signup" ? '<label>Trainer name<input name="name" maxlength="50" required autocomplete="nickname"></label>' : ""}<label>Email<input type="email" name="email" required autocomplete="email" maxlength="254"></label>${mode === "recover" ? '<label>Recovery code<input name="recoveryCode" required autocomplete="off"></label>' : ""}<label>${mode === "recover" ? "New password" : "Password"}<input type="password" name="password" required minlength="12" maxlength="128" autocomplete="${mode === "login" ? "current-password" : "new-password"}"></label>${mode !== "login" ? '<p class="small muted">Use at least 12 characters. Keep your recovery code somewhere safe; it is how you recover your account.</p>' : ""}<p class="error" id="auth-error" role="alert"></p><button class="btn primary">${mode === "signup" ? "Create account" : mode === "recover" ? "Reset password" : "Log in"}</button><div class="row">${button(mode === "login" ? "Create an account" : "Back to login", mode === "login" ? "auth-signup" : "auth-login")}${mode === "login" ? button("Use recovery code", "auth-recover") : ""}</div></form>`}`,
    true,
  );
}
function shareModal(kind = "collection") {
  const ids =
    kind === "trades"
      ? tagged("trade").map((p) => p.id)
      : catchEntries().map(([id]) => +id);
  const data = { n: store.data.profile.name, ids: ids.slice(0, 1100), kind };
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const url =
    location.origin +
    location.pathname +
    "?s=" +
    encodeURIComponent(payload) +
    "#collection";
  modal(
    `<div class="modal-header"><h2>Share your ${kind === "trades" ? "trade list" : "collection"}</h2></div><p class="muted">This link shares your trainer name and these ${ids.length} Pokémon. Private notes, email, catch locations, and friend code stay private.</p><label class="space">Share link<input id="share-url" readonly value="${esc(url)}"></label><div class="row space">${button("Copy link", "copy-share", true, "copy")}</div>`,
  );
}
function wrapped() {
  const caught = catchEntries();
  const counts = {};
  for (const [id] of caught) {
    for (const t of byId.get(+id)?.types || [])
      counts[t] = (counts[t] || 0) + 1;
  }
  const top =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Curiosity";
  modal(
    `<div class="modal-header"><span class="eyebrow">TRAINER WRAPPED · ${new Date().getFullYear()}</span></div><section class="spotlight" style="display:block"><div class="eyebrow">${esc(store.data.profile.name)}’S FIELD NOTES</div><h2 style="font-size:2.8rem;margin:20px 0">A very good<br>kind of collection.</h2><div class="stats-row" style="margin:25px 0 0;color:var(--ink)">${[
      [caught.length, "species caught"],
      [tagged("shiny").length, "shiny finds"],
      [store.data.journal.length, "field notes"],
      [title(top), "favourite type"],
    ]
      .map(([v, l]) => `<div><h2>${v}</h2><p>${l}</p></div>`)
      .join(
        "",
      )}</div></section><p class="small muted space">A snapshot of your saved collection, across all dates.</p><div class="row space">${button("Share collection", "share", true)}${button("Export collection", "export")}</div>`,
  );
}
function personality() {
  modal(
    `<div class="modal-header"><h2>What’s your adventure energy?</h2></div><p class="muted">Pick the one that feels like you. This is for fun.</p><div class="stack space">${[
      ["25", "Excitable. Snacks packed. Already outside."],
      ["143", "A nap is a perfectly valid adventure."],
      ["133", "Curious. A little of everything, please."],
      ["94", "Mischief, with excellent comedic timing."],
      ["1", "Steady growth. Small steps. Good company."],
    ]
      .map(
        ([id, l]) =>
          `<button class="btn" data-action="personality-result" data-id="${id}">${l}</button>`,
      )
      .join("")}</div>`,
    true,
  );
}
function calendarModal() {
  modal(
    `<div class="modal-header"><h2>Plan a little outing</h2></div><form class="stack" id="calendar-form"><label>Event name<input name="name" value="Pokémon adventure" required maxlength="100"></label><label>Date and time<input type="datetime-local" name="time" required></label><label>Note<input name="note" placeholder="Charge phone. Water. Snacks." maxlength="200"></label><button class="btn primary">Download calendar reminder</button><p class="small muted">Open the .ics file in Google Calendar, Apple Calendar, or Outlook to add the event and its 30-minute reminder.</p></form>`,
    true,
  );
}
function csvModal() {
  modal(
    `<div class="modal-header"><h2>Bring your GO list</h2></div><p class="muted small">Import your own CSV with columns: name, shiny, lucky, count. Use true or false for flags. Preview entries before adding them.</p><div class="row space">${button("Download CSV template", "csv-template")}</div><label class="space">Choose CSV<input type="file" id="go-csv" accept=".csv,text/csv"></label><div id="csv-preview" class="space"></div>`,
  );
}
let importRows = [];
function parseCsv(text) {
  const rows = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
function unusedRenderChatRemoved() {}
function guideAnswer(q) {
  const s = q.toLowerCase();
  const matched = catalog
    .filter(
      (p) => s.includes(p.name) || s.includes(p.name.replaceAll("-", " ")),
    )
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (/team/.test(s)) {
    const ps = store.data.team.map((id) => byId.get(id));
    if (!ps.length)
      return "Your team is still empty. Open Team builder and choose up to six Pokémon. I can then explain the weaknesses they share.";
    const risks = types
      .map((t) => ({
        t,
        n: ps.filter((p) => multiplier(t, p.types) > 1).length,
      }))
      .filter((x) => x.n >= 2);
    return `Your team: ${ps.map((p) => title(p.name)).join(", ")}.\n\n${risks.length ? "Shared weaknesses: " + risks.map((x) => `${title(x.t)} attacks hit ${x.n} teammates super effectively`).join("; ") + "." : "No attack type is super effective against two or more teammates."}\n\nThese are main-series defensive type matchups. Abilities and moves may change actual battle outcomes.`;
  }
  if (/next|goal|mission|today/.test(s)) return nextMission();
  if (/go|sync|connect/.test(s) && !matched)
    return "GO companion is your personal tracker. Add catches manually or import a CSV, plan buddy goals, and share trade lists. There is no live connection to your Pokémon GO account. GO to HOME transfers happen in the official apps and are one-way.";
  if (matched) {
    const p = matched;
    if (/evol/.test(s)) {
      const f = catalog.filter((x) => x.chain === p.chain);
      return `${title(p.name)} belongs to this evolution family: ${f.map((x) => title(x.name)).join(", ")}.\n\nOpen ${title(p.name)} → Evolutions for the family and live evolution conditions. GO requirements can differ from the main games.`;
    }
    if (/nick|name/.test(s))
      return `Three names for ${title(p.name)}: ${Array.from({ length: 3 }, () => nickname(p)).join(", ")}. A tiny menace deserves a good title.`;
    const w = weaknesses(p);
    return `${title(p.name)} is ${p.types.map(title).join(" / ")} type.\n\nWeak to: ${w.map((x) => `${title(x.type)} (×${x.m})`).join(", ")}.\n\nBase stats: HP ${p.stats[0]}, Attack ${p.stats[1]}, Defense ${p.stats[2]}, Sp. Atk ${p.stats[3]}, Sp. Def ${p.stats[4]}, Speed ${p.stats[5]}.\n\n${entry(p.id).caught ? "Already in your collection. Excellent taste." : "You have not marked this species as caught yet."}`;
  }
  const t = types.find((t) => s.includes(t));
  if (t) {
    const strong = types.filter((d) => multiplier(t, [d]) === 2);
    const immune = types.filter((d) => multiplier(t, [d]) === 0);
    return `${title(t)} attacks are super effective against ${strong.map(title).join(", ") || "no single types"}.${immune.length ? " They do no damage to " + immune.map(title).join(", ") + "." : ""}\n\nFor a Pokémon with two types, multiply both matchups. Use the Type chart in The lab for the full table.`;
  }
  return "In field guide mode I can look up Pokémon, explain type weaknesses, show evolution families, suggest nicknames, review your team, and suggest a next goal. Try a Pokémon name, “Review my team”, or “What next?”.";
}
async function chatSend(q) {
  if (chatBusy || !q.trim()) return;
  chatHistory.push({ role: "user", content: q.trim() });
  chatBusy = true;
  renderChat();
  let answer;
  try {
    if (store.assistant && store.session) {
      const r = await request("/api/dexter", {
        messages: chatHistory.slice(-10),
        team: store.data.team,
        question: q,
      });
      answer = r.answer;
    } else answer = guideAnswer(q);
  } catch {
    answer =
      "The conversation service is unavailable, so here is a field-guide answer:\n\n" +
      guideAnswer(q);
  }
  chatHistory.push({ role: "assistant", content: answer });
  chatBusy = false;
  renderChat();
}
document.addEventListener("click", async (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action,
    id = +el.dataset.id,
    v = el.dataset.value;
  try {
    switch (a) {
      case "open":
        openDetail(id);
        break;
      case "featured":
        openDetail(1);
        break;
      case "close":
        closeModal();
        break;
      case "fav":
        mutateFlag(id, "favourite");
        break;
      case "caught":
        mutateFlag(id, "caught");
        toast(
          entry(id).caught ? "A new little friend. Saved." : "Catch removed.",
        );
        break;
      case "flag":
        mutateFlag(id, v);
        break;
      case "detail-tab":
        detailTab = v;
        openDetail(detailId, true);
        break;
      case "shiny":
        shiny = !shiny;
        openDetail(detailId, true);
        break;
      case "type":
        type = v;
        limit = 24;
        renderView();
        break;
      case "grass":
        type = "grass";
        limit = 24;
        renderView();
        $("#search")?.focus();
        break;
      case "layout":
        layout = v;
        renderView();
        break;
      case "more":
        limit += 24;
        renderCatalog();
        break;
      case "clear":
        search = type = gen = rarity = "";
        limit = 24;
        renderView();
        break;
      case "collection-filter":
        collectionFilter = v;
        limit = 24;
        renderView();
        break;
      case "surprise": {
        const pool = catalog.filter((p) => !entry(p.id).caught);
        openDetail(
          (pool.length ? pool : catalog)[
            Math.floor(Math.random() * (pool.length || catalog.length))
          ].id,
        );
        break;
      }
      case "discover":
        closeModal();
        navigate("discover");
        break;
      case "journal":
        closeModal();
        navigate("journal");
        break;
      case "settings":
        closeModal();
        navigate("settings");
        break;
      case "account":
        navigate("settings");
        break;
      case "theme":
        store.data.preferences.mode =
          store.data.preferences.mode === "light" ? "dark" : "light";
        prefs();
        save();
        if (route === "settings") renderView();
        break;
      case "mode":
        store.data.preferences.mode = v === "dark" ? "dark" : "light";
        prefs();
        save();
        if (route === "settings") renderView();
        break;
      case "nickname":
        $('#notes-form input[name="nickname"]').value = nickname(byId.get(id));
        break;
      case "speak":
        if ("speechSynthesis" in window) {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(title(byId.get(id).name));
          u.rate = 0.8;
          speechSynthesis.speak(u);
        } else toast("Read-aloud is unavailable in this browser.");
        break;
      case "team-picker":
        picker("team");
        break;
      case "buddy-picker":
        picker("buddy");
        break;
      case "pick-buddy":
        store.data.profile.buddy = id;
        save();
        closeModal();
        renderView();
        toast("Buddy chosen. Adventure awaits.");
        break;
      case "pick-team":
      case "team-add":
        if (store.data.team.includes(id)) {
          toast("Already on your team.");
          break;
        }
        if (store.data.team.length >= 6) {
          toast("Six is a full house. Remove a teammate first.");
          break;
        }
        store.data.team.push(id);
        save();
        if (a === "pick-team") {
          closeModal();
          renderView();
        }
        toast(title(byId.get(id).name) + " joined your team.");
        break;
      case "team-remove":
        store.data.team = store.data.team.filter((x) => x !== id);
        save();
        renderView();
        break;
      case "compare-add":
        if (!compares.includes(id)) compares.push(id);
        compares = compares.slice(-4);
        detailId = null;
        compareView();
        break;
      case "compare-picker":
        picker("compare");
        break;
      case "pick-compare":
        if (!compares.includes(id)) compares.push(id);
        compares = compares.slice(-4);
        compareView();
        break;
      case "compare-clear":
        compares = [];
        picker("compare");
        break;
      case "compare-team":
        if (!store.data.team.length) toast("Add a teammate first.");
        else compareView(store.data.team);
        break;
      case "type-chart":
        typeChart();
        break;
      case "journal-new":
        journalModal();
        break;
      case "journal-delete": {
        const removed = store.data.journal.find((x) => x.id === v);
        store.data.journal = store.data.journal.filter((x) => x.id !== v);
        save();
        renderView();
        toast("Entry removed.");
        break;
      }
      case "goal-delete":
        store.data.goals = store.data.goals.filter((x) => x.id !== v);
        save();
        renderView();
        break;
      case "reset-checks":
        store.data.checks = {};
        save();
        renderView();
        break;
      case "wishlist":
        collectionFilter = "wishlist";
        navigate("collection");
        break;
      case "export":
        download("dexterous-backup-" + date() + ".json", {
          format: "dexterous-v1",
          exported: new Date().toISOString(),
          data: store.data,
        });
        toast("Your field guide backup is ready.");
        break;
      case "import": {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.addEventListener("change", async () => {
          const f = input.files[0];
          if (!f) return;
          if (f.size > 2000000) {
            toast("Choose a backup smaller than 2 MB.");
            return;
          }
          try {
            const value = JSON.parse(await f.text());
            if (value.format !== "dexterous-v1")
              throw Error("This is not a Dexterous backup.");
            modal(
              `<div class="modal-header"><h2>Import this field guide?</h2></div><p class="muted">This replaces your current guest or account collection with the backup. Export your existing collection first if you want to keep it.</p><div class="row space">${button("Export current collection", "export")}${button("Replace with backup", "confirm-import", true)}</div>`,
            );
            window.pendingDexBackup = value;
          } catch (e) {
            toast(e.message);
          }
        });
        input.click();
        break;
      }
      case "confirm-import":
        await importBackup(window.pendingDexBackup);
        delete window.pendingDexBackup;
        closeModal();
        shell();
        toast("Your field guide is back.");
        break;
      case "go-import":
        csvModal();
        break;
      case "csv-template":
        download(
          "dexterous-go-template.csv",
          "name,shiny,lucky,count\npikachu,true,false,2\nbulbasaur,false,true,1\n",
          "text/csv",
        );
        break;
      case "csv-confirm":
        for (const x of importRows)
          store.data.collection[x.id] = { ...entry(x.id), ...x.entry };
        await save();
        closeModal();
        renderView();
        toast(`${importRows.length} GO entries saved.`);
        break;
      case "share":
        shareModal();
        break;
      case "share-trades":
        shareModal("trades");
        break;
      case "copy-share":
        try {
          await navigator.clipboard.writeText($("#share-url").value);
          toast("Link copied. Share a little discovery.");
        } catch {
          $("#share-url").select();
          toast("Select and copy the link above.");
        }
        break;
      case "wrapped":
        wrapped();
        break;
      case "personality":
        personality();
        break;
      case "personality-result": {
        const p = byId.get(id);
        modal(
          `<div class="quiz"><div class="eyebrow">YOUR POCKET PERSONALITY</div><img class="revealed" src="${artwork(id)}" alt="${title(p.name)}"><h2>${title(p.name)} energy.</h2><p class="muted space">A perfectly good way to be.</p><div class="row space" style="justify-content:center"><button class="btn primary" data-action="open" data-id="${id}">Meet your match</button>${button("Try another vibe", "personality")}</div></div>`,
          true,
        );
        break;
      }
      case "quiz":
        quizStart();
        break;
      case "quiz-answer":
        if (quiz.answered) break;
        quiz.answered = true;
        const correct = id === quiz.p.id;
        if (correct) quiz.score++;
        quizDraw(
          correct
            ? "You know your little guys. Correct!"
            : `It’s ${title(quiz.p.name)}! Another one for the field notes.`,
        );
        break;
      case "quiz-next":
        if (quiz.index === 4) {
          store.data.quiz.best = Math.max(store.data.quiz.best, quiz.score);
          save();
          modal(
            `<div class="quiz"><div class="eyebrow">FIELD TEST COMPLETE</div><h1 class="space">${quiz.score} / 5</h1><h2 class="space">${quiz.score === 5 ? "Pocket professor." : "Curiosity looks good on you."}</h2><p class="muted space">Personal best: ${store.data.quiz.best} / 5</p><div class="row space" style="justify-content:center">${button("Another round", "quiz", true)}${button("Back to the lab", "close")}</div></div>`,
            true,
          );
        } else {
          quiz.index++;
          quizRound();
        }
        break;
      case "calendar":
        calendarModal();
        break;
      case "auth":
      case "auth-login":
        authModal();
        break;
      case "auth-signup":
        authModal("signup");
        break;
      case "auth-recover":
        authModal("recover");
        break;
      case "logout":
        await logout();
        shell();
        toast("Signed out. Your guest guide is ready.");
        break;
      case "install":
        if (installPrompt) {
          await installPrompt.prompt();
          installPrompt = null;
        }
        break;
    }
  } catch (e) {
    toast(e.message || "Something went wrong. Try again.");
  }
});
document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.id === "search") {
    search = el.value;
    limit = 24;
    renderCatalog();
  }
  if (el.id === "picker-search")
    $("#picker-results").innerHTML = pickerResults(
      el.value,
      el.dataset.purpose,
    );
});
document.addEventListener("change", async (ev) => {
  const el = ev.target;
  try {
    if (el.id === "region") {
      gen = el.value;
      limit = 24;
      renderCatalog();
    }
    if (el.id === "rarity") {
      rarity = el.value;
      limit = 24;
      renderCatalog();
    }
    if (el.id === "sort") {
      sort = el.value;
      renderCatalog();
    }
    if (el.dataset.check) {
      store.data.checks[el.dataset.check] = el.checked;
      save();
    }
    if (el.dataset.goal) {
      const g = store.data.goals.find((x) => x.id === el.dataset.goal);
      if (g) g.done = el.checked;
      save();
      renderView();
    }
    if (el.id === "pref-theme") {
      store.data.preferences.theme = el.value;
      prefs();
      save();
    }
    if (el.id === "pref-blue-light") {
      store.data.preferences.blueLight = el.checked;
      prefs();
      save();
    }
    if (el.id === "pref-font") {
      store.data.preferences.font = el.value;
      prefs();
      save();
    }
    if (el.id === "pref-motion") {
      store.data.preferences.motion = el.checked;
      prefs();
      save();
    }
    if (el.id === "go-csv") {
      const file = el.files[0];
      if (!file) return;
      if (file.size > 500000) throw Error("Use a CSV smaller than 500 KB.");
      const rows = parseCsv(await file.text());
      const head = rows.shift().map((x) =>
        x
          .trim()
          .toLowerCase()
          .replace(/^\uFEFF/, ""),
      );
      if (!head.includes("name")) throw Error("The CSV needs a name column.");
      let skipped = 0;
      importRows = [];
      for (const row of rows) {
        const val = Object.fromEntries(
          head.map((h, i) => [h, (row[i] || "").trim()]),
        );
        const p = catalog.find(
          (p) =>
            p.name === val.name.toLowerCase().replaceAll(" ", "-") ||
            String(p.id) === val.name,
        );
        if (!p) {
          skipped++;
          continue;
        }
        importRows.push({
          id: p.id,
          entry: {
            caught: true,
            seen: true,
            source: "go",
            shiny: val.shiny === "true",
            lucky: val.lucky === "true",
            count: Math.max(1, Math.min(999, +val.count || 1)),
            date: date(),
          },
        });
      }
      $("#csv-preview").innerHTML =
        `<p>${importRows.length} recognised · ${skipped} skipped</p><p class="small muted space">Matching species will be updated with the imported GO flags and count.</p><div class="types space">${importRows
          .slice(0, 20)
          .map(
            (x) =>
              `<span class="pill">${title(byId.get(x.id).name)}${x.entry.shiny ? " ✧" : ""}</span>`,
          )
          .join(
            "",
          )}</div>${importRows.length ? `<div class="space">${button("Confirm import", "csv-confirm", true)}</div>` : ""}`;
    }
  } catch (e) {
    toast(e.message);
  }
});
document.addEventListener("submit", async (ev) => {
  const form = ev.target;
  ev.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  try {
    if (form.id === "notes-form") {
      const id = +form.dataset.id;
      store.data.collection[id] = {
        ...entry(id),
        ...values,
        count: Math.max(1, Math.min(999, +values.count || 1)),
      };
      await save();
      toast("Field notes saved.");
    }
    if (form.id === "profile-form") {
      store.data.profile = { ...store.data.profile, ...values };
      await save();
      shell();
      toast("Trainer card saved.");
    }
    if (form.id === "journal-form") {
      store.data.journal.push({
        id: crypto.randomUUID(),
        ...values,
        distance: Math.max(0, +values.distance || 0),
      });
      await save();
      closeModal();
      navigate("journal");
      if (route === "journal") renderView();
      toast("Another memory in the field guide.");
    }
    if (form.id === "goal-form") {
      store.data.goals.push({
        id: crypto.randomUUID(),
        text: values.goal,
        done: false,
        date: date(),
      });
      await save();
      renderView();
    }
    if (form.id === "calendar-form") {
      const dt = new Date(values.time);
      if (Number.isNaN(+dt)) throw Error("Choose a valid date.");
      const end = new Date(+dt + 3600000);
      const fmt = (d) =>
        d
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "");
      const clean = (s) =>
        s
          .replace(/\\/g, "\\\\")
          .replace(/\n/g, "\\n")
          .replace(/[,;]/g, (x) => "\\" + x);
      download(
        "dexterous-adventure.ics",
        `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Dexterous//Field Guide//EN\r\nBEGIN:VEVENT\r\nUID:${crypto.randomUUID()}@dexterous\r\nDTSTAMP:${fmt(new Date())}\r\nDTSTART:${fmt(dt)}\r\nDTEND:${fmt(end)}\r\nSUMMARY:${clean(values.name)}\r\nDESCRIPTION:${clean(values.note)}\r\nBEGIN:VALARM\r\nTRIGGER:-PT30M\r\nACTION:DISPLAY\r\nDESCRIPTION:Your little adventure awaits\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
        "text/calendar",
      );
      closeModal();
      toast("Calendar reminder downloaded.");
    }
    if (form.id === "auth-form") {
      const btn = form.querySelector('button[type="submit"],button.primary');
      btn.disabled = true;
      btn.textContent = "One moment…";
      try {
        const r = await authenticate(form.dataset.mode, values);
        closeModal();
        shell();
        if (r.recoveryCode)
          modal(
            `<div class="modal-header"><h2>Keep this recovery code safe.</h2></div><p class="muted">This is your only account recovery method. Store it somewhere private. It is shown once.</p><p class="note space" style="font-family:monospace;word-break:break-all">${esc(r.recoveryCode)}</p><p class="small muted space">Your guest collection is still saved separately on this device. Export it before importing it into this account.</p>${button("I saved my recovery code", "close", true)}`,
            true,
          );
        else toast("Welcome back, trainer.");
      } catch (e) {
        $("#auth-error").textContent = e.message;
        btn.disabled = false;
        btn.textContent = "Try again";
      }
    }
  } catch (e) {
    toast(e.message);
  }
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    closeModal();
  }
  if (
    ev.key === "/" &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)
  ) {
    $("#search")?.focus();
    ev.preventDefault();
  }
  if (ev.key === "Tab" && $(".modal")) {
    const els = Array.from(
      $(".modal").querySelectorAll(
        "button:not([disabled]),input,select,textarea,a[href]",
      ),
    ).filter((x) => x.getClientRects().length);
    const first = els[0],
      last = els.at(-1);
    if (ev.shiftKey && document.activeElement === first) {
      last.focus();
      ev.preventDefault();
    } else if (!ev.shiftKey && document.activeElement === last) {
      first.focus();
      ev.preventDefault();
    }
  }
});
window.addEventListener("hashchange", () => {
  route = location.hash.slice(1).split("?")[0] || "discover";
  if (!navs.some((n) => n[0] === route)) route = "discover";
  search = type = gen = rarity = "";
  limit = 24;
  closeModal();
  shell();
  window.scrollTo({ top: 0 });
});
window.addEventListener("dex-status", () => {
  if ($("#save-status")) $("#save-status").textContent = store.status;
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
});
window.addEventListener("online", () =>
  toast("Back online. More discoveries await."),
);
window.addEventListener("offline", () =>
  toast("Offline. Saved entries and your collection still work."),
);
async function boot() {
  try {
    [catalog] = await Promise.all([
      fetch("./data/catalog.json").then((r) => {
        if (!r.ok) throw Error("Catalog unavailable");
        return r.json();
      }),
      init(),
    ]);
    byId = new Map(catalog.map((p) => [p.id, p]));
    route = location.hash.slice(1) || "discover";
    if (!navs.some((n) => n[0] === route)) route = "discover";
    shell();
    const params = new URLSearchParams(location.search);
    if (params.get("signup") === "1") authModal("signup");
    const shared = params.get("s");
    if (shared && shared.length < 20000) {
      try {
        const d = JSON.parse(decodeURIComponent(escape(atob(shared))));
        if (!Array.isArray(d.ids)) throw Error();
        const ids = d.ids.filter(Number.isInteger).filter((x) => byId.has(x));
        const yours = new Set(catchEntries().map(([id]) => +id));
        modal(
          `<div class="modal-header"><h2>${esc(String(d.n).slice(0, 50))}’s ${d.kind === "trades" ? "trade list" : "collection"}</h2></div><p class="muted">${ids.length} species shared · ${ids.filter((id) => yours.has(id)).length} in common with your collection</p><div class="catalog space">${ids
            .slice(0, 1100)
            .map((id) => card(byId.get(id)))
            .join("")}</div>`,
        );
      } catch {
        toast("That shared collection link could not be read.");
      }
    }
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("./sw.js").catch(() => {});
  } catch (e) {
    $("#app").innerHTML =
      `<div class="boot"><h1>The field guide hit a snag.</h1><p class="space">${esc(e.message)}. Check your connection and reload.</p><button class="btn space" onclick="location.reload()">Try again</button></div>`;
  }
}
document.addEventListener(
  "error",
  (e) => {
    const image = e.target;
    if (
      image.tagName === "IMG" &&
      image.src.includes("/shiny/") &&
      !image.dataset.fallback
    ) {
      image.dataset.fallback = "true";
      image.src = image.src.replace("/shiny/", "/");
      image.alt += " (regular artwork; shiny artwork unavailable)";
    }
  },
  true,
);
boot();
