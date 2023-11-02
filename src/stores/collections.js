import { defineStore, acceptHMRUpdate } from 'pinia';
import Dexie from 'dexie';
import { post, _delete } from '../utils/network';
import { useUser } from '../stores/user';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

import { SqliteClient } from '@sqlite.org/sqlite-wasm';
const imgUrl = new URL('../utils/sqlite-worker.mjs', import.meta.url).href

// This is the name of your database. It corresponds to the path in the OPFS.
const filename = '/test.sqlite3';
const sqlite = new SqliteClient(filename, imgUrl);
await sqlite.init();

const SCHEMA = `
  CREATE TABLE collection
  (
    name text
  );

  CREATE TABLE collection_card
  (
    collection_name text,
    card_id text,

    CONSTRAINT fk_collection_name
      FOREIGN KEY (collection_name)
      REFERENCES collection (name)

    CONSTRAINT fk_card_id
      FOREIGN KEY (card_id)
      REFERENCES card (id)
  );

  CREATE TABLE card
  (
    id text,
    data blob
  );
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
    insert into collection(name) values ('test'), ('test2');
    insert into collection_card(collection_name, card_id) values ('test', 'a131d558-5f6b-448b-a378-1882e2d02bd2');
    insert into card(id, data) values ('a131d558-5f6b-448b-a378-1882e2d02bd2', '${JSON.stringify(test_card)}');
`

let result = await sqlite.executeSql("drop table if exists collection; drop table if exists collection_card; drop table if exists card;")
console.log(result);
result = await sqlite.executeSql(SCHEMA);
// await sqlite.executeSql('INSERT INTO test VALUES(?, ?)', [6, 7]);
// const results = await sqlite.executeSql('SELECT * FROM test');
console.log(result);

result = await sqlite.executeSql(SEED);
console.log(result);

result = await sqlite.executeSql(`select id, data from card`);
console.log(result);

const db = new Dexie('mtg');
db.version(4).stores({
  collections: '&name, syncCode'
});

export const useCollections = defineStore('collections', {
  state: () => {
    return {
      collections: new Map(),
      open: [],
    };
  },
  getters: {
    names(state) {
      return [...state.collections.keys()].sort();
    },
    all(state) {
      return [...state.collections.keys()].sort();
      // https://cards.scryfall.io/art_crop/front/7/e/7e78b70b-0c67-4f14-8ad7-c9f8e3f59743.jpg?1562614382
    },
    obj(state) {
      let o = [];
      for (const [k, v] of state.collections.entries()) {
        v.name = k;
        o.push(v);
      }
      return o;
    }
  },
  actions: {
    async init() {

      result = await sqlite.executeSql(`
        select collection.name, count(card.id) as card_count
        from collection
        join collection_card on collection.name == collection_card.collection_name
        join card on collection_card.card_id == card.id
      `);
      console.log(result)
      result.forEach(col => {
        if (col.name === 'clipboard') return;
        this.collections.set(col.name, {
          // lastSync: col.lastSync || 0,
          lastSync: 0,
          downloaded: true,
          // image: col.cards[0]?.image_uris?.art_crop || "https://cards.scryfall.io/art_crop/front/7/e/7e78b70b-0c67-4f14-8ad7-c9f8e3f59743.jpg?1562614382",
          image: "https://cards.scryfall.io/art_crop/front/7/e/7e78b70b-0c67-4f14-8ad7-c9f8e3f59743.jpg?1562614382",
          count: col.card_count
        });
      });
    },
    async refreshPrices() {
      for (const name of this.open) {
        let collection = await db.collections.get({ name: name });

        var ids = [];
        for (const card of collection.cards) {
          ids.push(card.id);
        }
        const resp = await post(backendUrl + "/prices", {
          data: ids
        });

        let newCards = [];
        for (const card of collection.cards) {
          card.prices = resp.data[card.id];
          newCards.push(card);
        }
        await this.save(name, newCards);
      }
    },
    async delete(name) {
      const user = useUser();
      if (user.collections.has(name)) {
        await _delete(backendUrl + '/collection', {
          id: user.collections.get(name).id
        });
        // user.collections.delete(name);
      }
      await db.collections.delete(name);
      this.collections.delete(name);
      this.open.splice(this.open.indexOf(name), 1);
    },
    async save(name, cards) {
      let now = Date.now();
      console.log(cards[0]);
      console.log(JSON.stringify(cards[0]).replace("'", ""));

      await sqlite.executeSql(`insert into card(id, data) values ('${cards[0].id}', '${JSON.stringify(cards[0]).replace("'", "")}');`)
      // for (let card of cards) {
      //   await sqlite.executeSql(`insert into card(id, data) values ('${card.id}', '${JSON.stringify(card)}');`)
      // }
      return this.getCards('');

      await db.collections.put({ name: name, cards: cards, lastSync: now });
      if (!this.collections.has(name)) {
        this.collections.set(name, { downloaded: true, lastSync: now });
      }
      return this.all;
    },
    async replaceCard(collection, old, new_) {
      const col = await db.collections.get({ name: collection });
      let newCards = col.cards.filter(c => c.id !== old.id || c.finish !== old.finish);
      newCards.push(new_);
      await db.collections.update(collection, { cards: newCards });
    },
    async deleteCard(collectionNames, card) {
      for (const colName of collectionNames) {
        const col = await db.collections.get({ name: colName });
        const newCards = col.cards.filter(c => c.id !== card.id || c.finish !== card.finish);
        await db.collections.update(colName, { cards: newCards });
      }
    },
    async get(name) {
      return await db.collections.get({ name: name });
    },
    async load(names) {
      this.open = names;
      if (!names) return;

      const user = useUser();
      for (const name of names) {
        const co = this.collections.get(name);
        if (co && !co.downloaded) {
          await this.download(user.collections.get(name).id);
        }
      }
      return await this.getCards(names);
    },
    async getCards(names) {
      result = await sqlite.executeSql(`select id, data from card`);

      let re = [];
      for (const card of result) {
        re.push(JSON.parse(card.data));
      }
      return re;

      let cardMap = new Map();
      for (const name of names) {
        let collection = await db.collections.get({ name: name });
        if (collection && Object.keys(collection.cards).length > 0) {
          for (const card of collection.cards) {
            if (!card) {
              continue;
            }
            const cardKey = card.id + card.finish;
            if (cardMap.has(cardKey)) {
              let ex = cardMap.get(cardKey);
              ex.count = parseInt(ex.count) + parseInt(card.count);
              ex.collections.push(collection.name);
              cardMap.set(cardKey, ex);
            }
            else {
              card.collections = [collection.name];
              cardMap.set(cardKey, card);
            }
          }
        }
      }
      return [...cardMap.values()];
    },
    async upload(userToken, name) {
      try {
        const collection = await this.get(name);
        let data = {
          name: collection.name,
          userToken: userToken,
          cards: collection.cards.map(c => {
            return {
              id: c.id,
              count: c.count,
              tags: c.tags,
              finish: c.finish,
            };
          })
        };
        const resp = await post(backendUrl + '/collection', data);
        return resp.data;
      }
      catch (error) {
        console.error(error);
      }
    },
    async download(id) {
      try {
        const resp = await fetch(backendUrl + '/collection?id=' + id);
        const json = await resp.json();
        await this.save(json.data.name, json.data.cards);
        this.collections.get(json.data.name).downloaded = true;
      }
      catch (error) {
        console.error(error);
        return false;
      }
      return true;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCollections, import.meta.hot));
}
