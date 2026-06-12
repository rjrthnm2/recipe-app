// Canonical units and ingredient helpers.
//
// Going forward, ingredients are stored as structured objects:
//   { quantity: "1 1/2", unit: "cup", name: "flour", note: "sifted" }
// The 132 legacy recipes still store plain strings ("1 1/2 cups flour, sifted").
// Every helper here accepts BOTH shapes so old and new recipes coexist until
// we migrate the old data later.

export const UNIT_GROUPS = [
  {
    label: "Weight",
    units: [
      { key: "g", label: "g" },
      { key: "kg", label: "kg" },
      { key: "oz", label: "oz" },
      { key: "lb", label: "lb" },
    ],
  },
  {
    label: "Volume",
    units: [
      { key: "tsp", label: "tsp" },
      { key: "tbsp", label: "tbsp" },
      { key: "cup", label: "cup", plural: "cups" },
      { key: "ml", label: "ml" },
      { key: "l", label: "L" },
      { key: "floz", label: "fl oz" },
      { key: "pint", label: "pint", plural: "pints" },
      { key: "quart", label: "quart", plural: "quarts" },
      { key: "gallon", label: "gallon", plural: "gallons" },
    ],
  },
  {
    label: "Count / other",
    units: [
      { key: "piece", label: "piece", plural: "pieces" },
      { key: "can", label: "can", plural: "cans" },
      { key: "container", label: "container", plural: "containers" },
      { key: "package", label: "package", plural: "packages" },
      { key: "jar", label: "jar", plural: "jars" },
      { key: "bottle", label: "bottle", plural: "bottles" },
      { key: "box", label: "box", plural: "boxes" },
      { key: "bag", label: "bag", plural: "bags" },
      { key: "packet", label: "packet", plural: "packets" },
      { key: "pouch", label: "pouch", plural: "pouches" },
      { key: "stick", label: "stick", plural: "sticks" },
      { key: "stalk", label: "stalk", plural: "stalks" },
      { key: "head", label: "head", plural: "heads" },
      { key: "bunch", label: "bunch", plural: "bunches" },
      { key: "clove", label: "clove", plural: "cloves" },
      { key: "slice", label: "slice", plural: "slices" },
      { key: "pinch", label: "pinch", plural: "pinches" },
      { key: "dash", label: "dash", plural: "dashes" },
      { key: "to_taste", label: "to taste" },
    ],
  },
];

export const UNIT_MAP = Object.fromEntries(
  UNIT_GROUPS.flatMap((group) => group.units.map((unit) => [unit.key, unit])),
);

// Case-SENSITIVE shorthand that only differs by case in cooking notation:
//   T = Tablespoon, t = teaspoon. Checked before the lowercased map below.
const UNIT_ALIASES_CASE = {
  T: "tbsp",
  t: "tsp",
};

// Many spellings/abbreviations of legacy units -> our canonical key.
// (Lowercased before lookup, so "C" and "c" both resolve here.)
const UNIT_ALIASES = {
  g: "g", gram: "g", grams: "g",
  kg: "kg", kilo: "kg", kilogram: "kg", kilograms: "kg",
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  tsp: "tsp", tsps: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  tbsp: "tbsp", tbsps: "tbsp", tbls: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup", c: "cup",
  ml: "ml", milliliter: "ml", milliliters: "ml",
  l: "l", liter: "l", liters: "l", litre: "l", litres: "l",
  floz: "floz",
  pint: "pint", pints: "pint", pt: "pint",
  quart: "quart", quarts: "quart", qt: "quart",
  gallon: "gallon", gallons: "gallon", gal: "gallon",
  piece: "piece", pieces: "piece",
  can: "can", cans: "can", ccan: "can",
  container: "container", containers: "container",
  package: "package", packages: "package", pkg: "package", pkgs: "package",
  jar: "jar", jars: "jar",
  bottle: "bottle", bottles: "bottle",
  box: "box", boxes: "box",
  bag: "bag", bags: "bag",
  packet: "packet", packets: "packet",
  pouch: "pouch", pouches: "pouch",
  stick: "stick", sticks: "stick",
  stalk: "stalk", stalks: "stalk",
  head: "head", heads: "head",
  bunch: "bunch", bunches: "bunch",
  clove: "clove", cloves: "clove", cloveds: "clove",
  slice: "slice", slices: "slice",
  pinch: "pinch", pinches: "pinch",
  dash: "dash", dashes: "dash",
};

// Units that act as containers in "size before container" phrasing,
// e.g. "2 15 oz. cans Chili" -> unit: can, note: "15 oz".
const CONTAINER_UNITS = new Set([
  "can",
  "jar",
  "package",
  "container",
  "box",
  "bottle",
  "bag",
  "pouch",
  "packet",
]);

export function emptyIngredient() {
  return { quantity: "", unit: "", name: "", note: "" };
}

// Normalize messy legacy ingredient text: strip leading bullets/dashes and
// convert unicode fractions to ASCII. Shared by the editor and shopping list.
export function cleanIngredientText(raw) {
  return String(raw ?? "")
    .replace(/^[\s*•◦‣⁃·‐-―-]+/, "") // leading bullets / dashes (incl. unicode)
    .replace(/⁄/g, "/") // unicode fraction slash ⁄ -> /
    .replace(/^\/(\d)/, "1/$1") // orphaned leading fraction "⁄2" -> "1/2"
    .replace(/^~\s*/, "") // "~2 lb." -> "2 lb."
    .replace(/½/g, " 1/2")
    .replace(/¼/g, " 1/4")
    .replace(/¾/g, " 3/4")
    .replace(/⅓/g, " 1/3")
    .replace(/⅔/g, " 2/3")
    .replace(/\s+/g, " ")
    .trim();
}

export function isStructuredIngredient(ing) {
  return Boolean(ing) && typeof ing === "object";
}

// Turn a quantity ("1", "1.5", "1/2", "1 1/2") into a number for math.
export function parseQuantity(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const match = String(value)
    .trim()
    .match(/^(\d+(?:[\s-]\d+\/\d+|\/\d+|\.\d+)?)/);
  if (!match) return 0;

  const qtyStr = match[1].trim();
  if (qtyStr.includes("/")) {
    const parts = qtyStr.split(/[\s-]/);
    if (parts.length === 2 && parts[1].includes("/")) {
      const [whole, frac] = parts;
      const [num, den] = frac.split("/");
      return parseInt(whole, 10) + parseInt(num, 10) / parseInt(den, 10);
    }
    const [num, den] = qtyStr.split("/");
    return parseInt(num, 10) / parseInt(den, 10);
  }
  return parseFloat(qtyStr);
}

export function getUnitLabel(key, qty = 0) {
  const unit = UNIT_MAP[key];
  if (!unit) return "";
  if (unit.plural && qty !== 1) return unit.plural;
  return unit.label;
}

// Render an ingredient (structured object OR legacy string) to display text.
export function formatIngredient(ing) {
  if (!ing) return "";
  if (typeof ing === "string") return ing;

  const { quantity, unit, name, note } = ing;

  if (unit === "to_taste") {
    const base = name ? `${name}, to taste` : "to taste";
    return note ? `${base} (${note})` : base;
  }

  const qtyNum = parseQuantity(quantity);
  const parts = [];
  if (quantity) parts.push(String(quantity).trim());
  const unitLabel = unit ? getUnitLabel(unit, qtyNum) : "";
  if (unitLabel) parts.push(unitLabel);
  if (name) parts.push(name);

  let text = parts.join(" ").trim();
  if (note) text += `, ${note}`;
  return text;
}

// Best-effort conversion of a legacy string into a structured ingredient.
// Conservative: only pulls out a leading number and a recognized unit token;
// everything else stays in `name` so nothing is lost.
export function normalizeIngredient(raw) {
  if (isStructuredIngredient(raw)) {
    return {
      quantity: raw.quantity ?? "",
      unit: raw.unit ?? "",
      name: raw.name ?? "",
      note: raw.note ?? "",
    };
  }

  const text = cleanIngredientText(raw);
  if (!text) return emptyIngredient();

  let rest = text;
  let quantity = "";
  const notes = [];

  // Quantity, including mixed fractions ("1 1/2") and ranges ("3-4",
  // "2 to 3", "1 to 1-1/2").
  const qtyMatch = rest.match(
    /^(\d+(?:[\s-]\d+\/\d+|\/\d+|\.\d+)?(?:\s*(?:-|–|to)\s*\d+(?:[\s-]\d+\/\d+|\/\d+|\.\d+)?)?)\s*(.*)$/i,
  );
  if (qtyMatch) {
    quantity = qtyMatch[1].trim();
    rest = qtyMatch[2].trim();
  }

  // Strip a stray dash/bullet left on the remainder, e.g. "1-can" -> "can".
  rest = rest.replace(/^[\s*•◦‣⁃·‐-―-]+/, "").trim();

  // Pull leading "(...)" package sizes into the note, e.g. "1 (11-oz) can".
  const takeLeadingParens = () => {
    let m;
    while ((m = rest.match(/^\(([^)]*)\)\s*(.*)$/))) {
      if (m[1].trim()) notes.push(m[1].trim());
      rest = m[2].trim();
    }
  };
  takeLeadingParens();

  const matchUnitToken = (token) => {
    const rawFirst = (token || "").replace(/\.$/, ""); // keep case; drop dot
    const lowerFirst = rawFirst.toLowerCase().replace(/\./g, "");
    return UNIT_ALIASES_CASE[rawFirst] || UNIT_ALIASES[lowerFirst] || "";
  };

  // A second leading number with a weight/volume measure is a package SIZE,
  // not the amount: "2 15 oz. cans Chili", "1 8 oz. cream cheese". It moves
  // to the note; a container word after it ("cans") becomes the unit below.
  const takeLeadingSize = () => {
    const sizeMatch = rest.match(
      /^(\d[\d\s/.-]*?\s*(?:oz|ounces?|lbs?|pounds?|g|kg|ml|l)\b\.?)\s+(.*)$/i,
    );
    if (sizeMatch && quantity) {
      notes.push(sizeMatch[1].replace(/\.$/, "").trim());
      rest = sizeMatch[2].trim();
    }
  };
  takeLeadingSize();

  let unit = "";
  const tokens = rest.split(/\s+/);
  if (tokens.length > 1 || (tokens.length === 1 && quantity)) {
    const matched = matchUnitToken(tokens[0]);
    if (matched) {
      unit = matched;
      tokens.shift();
      rest = tokens.join(" ").trim();
    }
  }

  // Sizes can also follow the unit: "1 can (10-1/2 oz) chicken broth",
  // "1 pkg. 10 oz. frozen peas", or an unclosed "(10 oz. whole tomatoes".
  takeLeadingParens();
  if (rest.startsWith("(") && !rest.includes(")")) {
    rest = rest.slice(1).trim();
  }
  takeLeadingSize();

  const commaIdx = rest.indexOf(",");
  if (commaIdx >= 0) {
    notes.push(rest.slice(commaIdx + 1).trim());
    rest = rest.slice(0, commaIdx).trim();
  }

  // Any "(...)" inside the name moves to the note, e.g. "tomato sauce (8 oz)"
  // or "butter beans (15 oz) drained".
  rest = rest
    .replace(/\(([^)]*)\)/g, (_, inner) => {
      if (inner.trim()) notes.push(inner.trim());
      return " ";
    })
    .replace(/\s+/g, " ")
    .trim();

  return {
    quantity,
    unit,
    name: rest,
    note: notes.filter(Boolean).join(", "),
  };
}

// Unique, sorted list of ingredient NAMES used across all recipes (structured
// or legacy). Powers the autocomplete so naming stays consistent.
export function collectIngredientNames(recipes = []) {
  const seen = new Map(); // lowercased key -> first-seen display form
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients || []) {
      const name = (normalizeIngredient(ing).name || "").trim();
      // Skip blanks, names with no letters, anything still carrying a number
      // (likely an unparsed legacy line), and very long phrases.
      if (!name || !/[a-z]/i.test(name) || /\d/.test(name) || name.length > 40)
        continue;
      const key = name.toLowerCase();
      if (!seen.has(key)) seen.set(key, name);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
