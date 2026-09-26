export const types = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];
export const regions = [
  "All regions",
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar",
  "Paldea",
];
export const title = (s) =>
  String(s || "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const artwork = (id, shiny = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shiny ? "shiny/" : ""}${Number(id)}.png`;
const memory = new Map();
export async function api(path) {
  const url = path.startsWith("https://pokeapi.co/")
    ? path
    : `https://pokeapi.co/api/v2/${path}`;
  if (memory.has(url)) return memory.get(url);
  let cached;
  try {
    cached = JSON.parse(localStorage.getItem("dex-cache:" + url));
  } catch {}
  if (cached && Date.now() - cached.at < 604800000) {
    memory.set(url, cached.data);
    return cached.data;
  }
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw Error("The field guide is temporarily unreachable.");
    const data = await r.json();
    memory.set(url, data);
    try {
      localStorage.setItem(
        "dex-cache:" + url,
        JSON.stringify({ at: Date.now(), data }),
      );
    } catch {}
    return data;
  } catch (e) {
    if (cached) return cached.data;
    throw e;
  }
}
// Attack type: double, half, and no damage against defending types.
const matchups = {
  normal: [[], ["rock", "steel"], ["ghost"]],
  fire: [
    ["grass", "ice", "bug", "steel"],
    ["fire", "water", "rock", "dragon"],
    [],
  ],
  water: [["fire", "ground", "rock"], ["water", "grass", "dragon"], []],
  electric: [["water", "flying"], ["electric", "grass", "dragon"], ["ground"]],
  grass: [
    ["water", "ground", "rock"],
    ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
    [],
  ],
  ice: [
    ["grass", "ground", "flying", "dragon"],
    ["fire", "water", "ice", "steel"],
    [],
  ],
  fighting: [
    ["normal", "ice", "rock", "dark", "steel"],
    ["poison", "flying", "psychic", "bug", "fairy"],
    ["ghost"],
  ],
  poison: [
    ["grass", "fairy"],
    ["poison", "ground", "rock", "ghost"],
    ["steel"],
  ],
  ground: [
    ["fire", "electric", "poison", "rock", "steel"],
    ["grass", "bug"],
    ["flying"],
  ],
  flying: [["grass", "fighting", "bug"], ["electric", "rock", "steel"], []],
  psychic: [["fighting", "poison"], ["psychic", "steel"], ["dark"]],
  bug: [
    ["grass", "psychic", "dark"],
    ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
    [],
  ],
  rock: [["fire", "ice", "flying", "bug"], ["fighting", "ground", "steel"], []],
  ghost: [["psychic", "ghost"], ["dark"], ["normal"]],
  dragon: [["dragon"], ["steel"], ["fairy"]],
  dark: [["psychic", "ghost"], ["fighting", "dark", "fairy"], []],
  steel: [["ice", "rock", "fairy"], ["fire", "water", "electric", "steel"], []],
  fairy: [["fighting", "dragon", "dark"], ["fire", "poison", "steel"], []],
};
export function multiplier(attack, defense) {
  const m = matchups[attack];
  return defense.reduce(
    (v, t) =>
      v *
      (m[2].includes(t)
        ? 0
        : m[0].includes(t)
          ? 2
          : m[1].includes(t)
            ? 0.5
            : 1),
    1,
  );
}
export function weaknesses(p) {
  return types
    .map((t) => ({ type: t, m: multiplier(t, p.types) }))
    .filter((x) => x.m > 1)
    .sort((a, b) => b.m - a.m);
}
export function nickname(p) {
  const first = {
    fire: ["Ember", "Toast", "Sizzle"],
    water: ["Splash", "Bubble", "Puddle"],
    grass: ["Sprout", "Pickle", "Moss"],
    electric: ["Watt", "Spark", "Static"],
    ghost: ["Boo", "Spook", "Midnight"],
    fairy: ["Glitter", "Peach", "Twinkle"],
  };
  const a = first[p.types[0]] || ["Bean", "Mochi", "Noodle"];
  const b = ["McWiggle", "Biscuit", "the Bold", "Button", "Sprinkles"];
  return `${a[Math.floor(Math.random() * a.length)]} ${b[Math.floor(Math.random() * b.length)]}`;
}
