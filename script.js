const API = "https://pokeapi.co/api/v2";
const pokemonList = document.getElementById("pokemon-list");

/* ===========================
   PvP META COUNTER POOL
   (Smogon / VGC-style logic)
=========================== */
const PVP_META = {
  fire: ["garchomp", "landorus-therian", "garganacl"],
  water: ["rillaboom", "zapdos", "iron-hands"],
  electric: ["great-tusk", "garchomp"],
  grass: ["heatran", "volcarona"],
  ice: ["heatran", "kingambit"],
  fighting: ["flutter-mane", "tornadus-therian"],
  ground: ["iron-bundle", "rillaboom"],
  flying: ["zapdos", "thundurus-therian"],
  psychic: ["kingambit", "chien-pao"],
  dark: ["iron-valiant", "flutter-mane"],
  fairy: ["heatran", "gengar"],
  steel: ["great-tusk", "iron-hands"],
  dragon: ["flutter-mane", "azumarill"],
  ghost: ["kingambit", "chien-pao"],
  rock: ["urshifu-rapid-strike"],
  bug: ["volcarona"],
  poison: ["great-tusk"],
  normal: ["iron-valiant"]
};

/* ===========================
   LOAD ALL POKÉMON + FORMS
=========================== */
fetch(`${API}/pokemon?limit=2000`)
  .then(res => res.json())
  .then(data => {
    data.results.forEach(p => {
      const option = document.createElement("option");
      option.value = p.name;
      pokemonList.appendChild(option);
    });
  });

/* ===========================
   HOME RESET
=========================== */
function goHome() {
  document.getElementById("pokemonInput").value = "";
  document.getElementById("pokeName").innerText = "";
  document.getElementById("types").innerText = "";
  document.getElementById("sprite").src = "";
  ["damage", "counters", "moves"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });
}

/* ===========================
   MAIN ANALYSIS
=========================== */
async function analyzePokemon() {
  const name = document.getElementById("pokemonInput").value.toLowerCase();
  const res = await fetch(`${API}/pokemon/${name}`);
  if (!res.ok) return alert("Pokémon not found");

  const data = await res.json();
  const types = data.types.map(t => t.type.name);

  document.getElementById("pokeName").innerText = data.name.toUpperCase();
  document.getElementById("types").innerText = types.join(", ");

  document.getElementById("sprite").src =
    data.sprites.other["official-artwork"].front_default ||
    data.sprites.front_default;

  calculateDamage(types);
  suggestPvPCounters(types);
  suggestMoves(types);
}

/* ===========================
   DAMAGE MULTIPLIERS
=========================== */
async function calculateDamage(defTypes) {
  const ul = document.getElementById("damage");
  ul.innerHTML = "";

  const multipliers = {};

  for (let type of defTypes) {
    const res = await fetch(`${API}/type/${type}`);
    const data = await res.json();

    data.damage_relations.double_damage_from.forEach(t => {
      multipliers[t.name] = (multipliers[t.name] || 1) * 2;
    });

    data.damage_relations.half_damage_from.forEach(t => {
      multipliers[t.name] = (multipliers[t.name] || 1) * 0.5;
    });

    data.damage_relations.no_damage_from.forEach(t => {
      multipliers[t.name] = 0;
    });
  }

  Object.entries(multipliers)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, mult]) => {
      const li = document.createElement("li");
      li.textContent = `${type.toUpperCase()} → ${mult}×`;
      ul.appendChild(li);
    });
}

/* ===========================
   PvP META COUNTERS
=========================== */
function suggestPvPCounters(defTypes) {
  const ul = document.getElementById("counters");
  ul.innerHTML = "";

  const counters = new Set();

  defTypes.forEach(type => {
    if (PVP_META[type]) {
      PVP_META[type].forEach(p => counters.add(p));
    }
  });

  [...counters].slice(0, 6).forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    ul.appendChild(li);
  });
}

/* ===========================
   SUPER-EFFECTIVE MOVES
=========================== */
async function suggestMoves(defTypes) {
  const ul = document.getElementById("moves");
  ul.innerHTML = "";

  for (let type of defTypes) {
    const res = await fetch(`${API}/type/${type}`);
    const data = await res.json();

    data.damage_relations.double_damage_from.forEach(async counterType => {
      const typeRes = await fetch(counterType.url);
      const typeData = await typeRes.json();

      const move =
        typeData.moves[Math.floor(Math.random() * typeData.moves.length)].name;

      const li = document.createElement("li");
      li.textContent = `${move} (${counterType.name})`;
      ul.appendChild(li);
    });
  }
}
