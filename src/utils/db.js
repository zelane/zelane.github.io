
import { SharedService } from "../utils/SharedService.js";
import { SqliteClient } from '../utils/sqlite-client.mjs';
import SqliteWorker from '../utils/sqlite-worker?worker&url'


const SCHEMA = `
      CREATE TABLE IF NOT EXISTS collection
      (
        name TEXT PRIMARY KEY
      );
      CREATE INDEX IF NOT EXISTS idx_collection_name ON collection (name);

      CREATE TABLE IF NOT EXISTS collection_card
      (
        collection_name TEXT NOT NULL,
        card_id TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        finish STRING DEFAULT 'nonfoil',
        UNIQUE(collection_name, card_id, finish)

        CONSTRAINT fk_collection_name
          FOREIGN KEY (collection_name)
          REFERENCES collection (name)
          ON DELETE CASCADE

        CONSTRAINT fk_card_id
          FOREIGN KEY (card_id)
          REFERENCES card (id)
          ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_collection_name ON collection_card (collection_name);
      CREATE INDEX IF NOT EXISTS idx_collection_card_id ON collection_card (card_id);

      CREATE TABLE IF NOT EXISTS card
      (
        id TEXT PRIMARY KEY,
        data JSON NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_card_id ON card (id);
    `;

const test_card = {
  "object": "card",
  "id": "a131d558-5f6b-448b-a378-1882e2d02bd2",
  "oracle_id": "fb9af562-7384-4575-93bb-34f1ada23735",
  "multiverse_ids": [
    423719
  ],
  "mtgo_id": 62665,
  "mtgo_foil_id": 62666,
  "tcgplayer_id": 126455,
  "cardmarket_id": 294870,
  "name": "Alley Strangler",
  "lang": "en",
  "released_at": "2017-01-20",
  "uri": "https://api.scryfall.com/cards/a131d558-5f6b-448b-a378-1882e2d02bd2",
  "scryfall_uri": "https://scryfall.com/card/aer/52/alley-strangler?utm_source=api",
  "layout": "normal",
  "highres_image": true,
  "image_status": "highres_scan",
  "image_uris": {
    "small": "https://cards.scryfall.io/small/front/a/1/a131d558-5f6b-448b-a378-1882e2d02bd2.jpg?1576381609",
    "normal": "https://cards.scryfall.io/normal/front/a/1/a131d558-5f6b-448b-a378-1882e2d02bd2.jpg?1576381609",
    "large": "https://cards.scryfall.io/large/front/a/1/a131d558-5f6b-448b-a378-1882e2d02bd2.jpg?1576381609",
    "png": "https://cards.scryfall.io/png/front/a/1/a131d558-5f6b-448b-a378-1882e2d02bd2.png?1576381609",
    "art_crop": "https://cards.scryfall.io/art_crop/front/a/1/a131d558-5f6b-448b-a378-1882e2d02bd2.jpg?1576381609",
    "border_crop": "https://cards.scryfall.io/border_crop/front/a/1/a131d558-5f6b-448b-a378-1882e2d02bd2.jpg?1576381609"
  },
  "mana_cost": "{2}{B}",
  "cmc": 3,
  "type_line": "Creature — Aetherborn Rogue",
  "oracle_text": "Menace",
  "power": "2",
  "toughness": "3",
  "colors": [
    "B"
  ],
  "color_identity": [
    "B"
  ],
  "keywords": [
    "Menace"
  ],
  "legalities": {
    "standard": "not_legal",
    "future": "not_legal",
    "historic": "legal",
    "gladiator": "legal",
    "pioneer": "legal",
    "explorer": "legal",
    "modern": "legal",
    "legacy": "legal",
    "pauper": "legal",
    "vintage": "legal",
    "penny": "not_legal",
    "commander": "legal",
    "oathbreaker": "legal",
    "brawl": "not_legal",
    "historicbrawl": "legal",
    "alchemy": "not_legal",
    "paupercommander": "legal",
    "duel": "legal",
    "oldschool": "not_legal",
    "premodern": "not_legal",
    "predh": "not_legal"
  },
  "games": [
    "paper",
    "mtgo"
  ],
  "reserved": false,
  "foil": true,
  "nonfoil": true,
  "finishes": [
    "nonfoil",
    "foil"
  ],
  "oversized": false,
  "promo": false,
  "reprint": false,
  "variation": false,
  "set_id": "a4a0db50-8826-4e73-833c-3fd934375f96",
  "set": "aer",
  "set_name": "Aether Revolt",
  "set_type": "expansion",
  "set_uri": "https://api.scryfall.com/sets/a4a0db50-8826-4e73-833c-3fd934375f96",
  "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Aaer&unique=prints",
  "scryfall_set_uri": "https://scryfall.com/sets/aer?utm_source=api",
  "rulings_uri": "https://api.scryfall.com/cards/a131d558-5f6b-448b-a378-1882e2d02bd2/rulings",
  "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Afb9af562-7384-4575-93bb-34f1ada23735&unique=prints",
  "collector_number": "52",
  "digital": false,
  "rarity": "common",
  "flavor_text": "\"You never know what day might be your last.\"",
  "card_back_id": "0aeebaf5-8c7d-4636-9e82-8c27447861f7",
  "artist": "Efflam Mercier",
  "artist_ids": [
    "b0ab565f-0406-4a72-8291-d48958e14b23"
  ],
  "illustration_id": "e75586a9-a994-48aa-aac2-2cc8ede392bf",
  "border_color": "black",
  "frame": "2015",
  "full_art": false,
  "textless": false,
  "booster": true,
  "story_spotlight": false,
  "edhrec_rank": 19784,
  "penny_rank": 9816,
  "prices": {
    "usd": "0.06",
    "usd_foil": "0.15",
    "usd_etched": null,
    "eur": "0.04",
    "eur_foil": "0.13",
    "tix": "0.03"
  },
  "related_uris": {
    "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=423719",
    "tcgplayer_infinite_articles": "https://infinite.tcgplayer.com/search?contentMode=article&game=magic&partner=scryfall&q=Alley+Strangler&utm_campaign=affiliate&utm_medium=api&utm_source=scryfall",
    "tcgplayer_infinite_decks": "https://infinite.tcgplayer.com/search?contentMode=deck&game=magic&partner=scryfall&q=Alley+Strangler&utm_campaign=affiliate&utm_medium=api&utm_source=scryfall",
    "edhrec": "https://edhrec.com/route/?cc=Alley+Strangler"
  },
  "purchase_uris": {
    "tcgplayer": "https://www.tcgplayer.com/product/126455?page=1&utm_campaign=affiliate&utm_medium=api&utm_source=scryfall",
    "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Search?referrer=scryfall&searchString=Alley+Strangler&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
    "cardhoarder": "https://www.cardhoarder.com/cards/62665?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
  },
  "finish": "nonfoil",
  "count": 1,
  "price": 0.034625515600000004,
  "type": "Creature",
  "collections": [
    "test"
  ]
}

const SEED = `
  insert into collection(name) values ('All') on conflict do nothing;
`

const worker = new Worker(new URL('../utils/wa-worker2.js', import.meta.url), { type: 'module' });
const sharedService = new SharedService('ahp-demo', async () => {
  const providerPort = await new Promise(resolve => {
    worker.addEventListener('message', event => {
      resolve(event.ports[0]);
    }, { once: true });
    worker.postMessage(null);
  });
  return providerPort;
});
sharedService.activate();


const sqlite = {}
// sqlite.executeSql = async (query) => { return await sharedService.proxy.query(query) };
sqlite.executeSql = async (query) => {
  const result = await sharedService.proxy.query(query)
  // const result = await sql`${query}`;
  let ret = []
  if (result.length > 0) {
    for (const row of result[0].rows) {
      let obj = {}
      result[0].columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      ret.push(obj);
    }
  }
  return ret;
}


const opfsRoot = await navigator.storage.getDirectory('/');
for await (let [name, handle] of opfsRoot.entries()) {
  // console.log(name)
  // if ('/' + name != filename) {
  //   opfsRoot.removeEntry(name);
  // }
}


// const filename = '/test.sqlite';
// const sqlite = new SqliteClient(filename, SqliteWorker);
// await sqlite.init();

// result = await sqlite.executeSql("drop table if exists collection; drop table if exists collection_card; drop table if exists card;")
// result = await sqlite.executeSql("delete from collection_card where collection_name = 'clipboard'")
await sqlite.executeSql(SCHEMA);
await sqlite.executeSql(SEED);

// console.log("Starting vacuum");
// result = await sqlite.executeSql('VACUUM');
// console.log("Vacuum complete");

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('../utils/wa-worker2.js', import.meta.url))
    .then(function () { console.log('Service Worker Registered'); });
}

export default sqlite;

