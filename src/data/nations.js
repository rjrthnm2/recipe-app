// The nations Jewel's ministry has touched — the single source of truth for
// the About page globe, chips, and story cards. Adding a nation here is all
// it takes for the globe and the "and counting" stat to pick it up.
//
// id    = ISO3 code, must match a feature id in
//         public/data/world-countries.geojson
// category: "home" | "traveled" (ministered in person)
//         | "reached" (lives touched through her small groups)
// story = first person, 2-3 sentences, no em dashes.

export const CATEGORY_LABELS = {
  home: "Home",
  traveled: "Traveled & ministered",
  reached: "Lives reached",
};

export const NATIONS = [
  {
    id: "USA",
    name: "United States",
    lat: 39.8,
    lng: -98.6,
    category: "home",
    story:
      "This is home. My house is where the recipes are collected, the small groups gather, and the coffee is always on. Everything on this globe started in my living room.",
  },
  {
    id: "RUS",
    name: "Russia",
    lat: 60.0,
    lng: 90.0,
    category: "traveled",
    story:
      "I traveled to Russia and had the joy of ministering there in person. God was moving long before I ever arrived. I just got to watch Him work.",
  },
  {
    id: "CHN",
    name: "China",
    lat: 35.0,
    lng: 103.0,
    category: "traveled",
    story:
      "Ministering in China showed me just how big God's family really is. I left a piece of my heart there and brought home more than I carried in.",
  },
  {
    id: "KAZ",
    name: "Kazakhstan",
    lat: 48.0,
    lng: 67.0,
    category: "reached",
    story:
      "Through my small groups and the friendships God has sent my way, lives in Kazakhstan have been touched by prayer and His love.",
  },
  {
    id: "IND",
    name: "India",
    lat: 21.0,
    lng: 78.0,
    category: "reached",
    story:
      "Prayer knows no distance. Through the people God has brought into my life, His love has reached friends in India.",
  },
  {
    id: "KEN",
    name: "Kenya",
    lat: 0.5,
    lng: 37.9,
    category: "reached",
    story:
      "From my living room to Kenya. God has connected my little groups to lives there in ways only He could arrange.",
  },
  {
    id: "GHA",
    name: "Ghana",
    lat: 7.9,
    lng: -1.0,
    category: "reached",
    story:
      "I have watched God weave Ghana into my story through the people He has placed in my path. We pray, and He moves.",
  },
  {
    id: "BRA",
    name: "Brazil",
    lat: -10.8,
    lng: -52.9,
    category: "reached",
    story:
      "Brazil holds people I count as family in the Lord. The miles do not matter much when God is in it.",
  },
  {
    id: "ZAF",
    name: "South Africa",
    lat: -29.0,
    lng: 24.7,
    category: "reached",
    story:
      "God has knit my heart to lives in South Africa through prayer and friendship. He is faithful there, just as He is everywhere.",
  },
  {
    id: "NGA",
    name: "Nigeria",
    lat: 9.1,
    lng: 8.7,
    category: "reached",
    story:
      "Through my small groups, God has touched lives in Nigeria. It still amazes me what He can do from one living room.",
  },
];
