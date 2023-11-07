import { defineStore, acceptHMRUpdate } from 'pinia';
import { post, _delete } from '../utils/network';
import { useUser } from '../stores/user';
import * as Comlink from 'comlink';

const backendUrl = import.meta.env.VITE_BACKEND_URL;


import { SqliteClient } from '@sqlite.org/sqlite-wasm';
import SqliteWorker from '../utils/sqlite-worker?worker&url'


const worker = new Worker(new URL('../utils/wa-worker.js', import.meta.url), { type: 'module' });
await new Promise(resolve => {
  worker.addEventListener('message', resolve, { once: true });
});

const config = {
  dbName: 'test.sqlite',
}
const workerProxy = Comlink.wrap(worker);
const sql = await workerProxy(config);
const sqlite = {}

sqlite.executeSql = async (query) => {
  const result = await sql`${query}`;
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

const filename = '/test.sqlite';

const opfsRoot = await navigator.storage.getDirectory('/');
for await (let [name, handle] of opfsRoot.entries()) {
  console.log(name)
  if ('/' + name != filename) {
    opfsRoot.removeEntry(name);
  }
}

// const sqlite = new SqliteClient(filename, SqliteWorker);
// await sqlite.init();


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
    insert into collection(name) values ('test') on conflict do nothing;
    insert into collection_card(collection_name, card_id, count, finish) values ('test', 'a131d558-5f6b-448b-a378-1882e2d02bd2', 2, 'foil') on conflict do nothing;
    insert into card(id, data) values ('a131d558-5f6b-448b-a378-1882e2d02bd2', json('${JSON.stringify(test_card)}')) on conflict do nothing;
`
let result = null;
// result = await sqlite.executeSql("drop table if exists collection; drop table if exists collection_card; drop table if exists card;")
result = await sqlite.executeSql(SCHEMA);
result = await sqlite.executeSql(SEED);

// console.log("Starting vacuum");
// result = await sqlite.executeSql('VACUUM');
// console.log("Vacuum complete");

// result = await sqlite.executeSql(`select id, data->'name' from card`);


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
        select collection.name, sum(collection_card.count) as card_count
        from collection
        left outer join collection_card on collection.name == collection_card.collection_name
        left outer join card on collection_card.card_id == card.id
        group by collection_card.collection_name
      `);

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
        let results = await sqlite.executeSql(`select card_id from collection_card where collection_name = '${name}'`)
        var ids = results.map(row => row['card_id']);

        const resp = await post(backendUrl + "/prices", {
          data: ids
        });

        await sqlite.executeSql('begin transaction');
        for (const [id, price] of Object.entries(resp['data'])) {
          results = await sqlite.executeSql(`
            update card
            set data = json_set(data, '$.prices', json('${JSON.stringify(price)}'))
            where id = '${id}'
        `)
        }
        await sqlite.executeSql('commit transaction');
      }
    },
    async delete(name) {
      const user = useUser();
      if (user.collections.has(name)) {
        await _delete(backendUrl + '/collection', {
          id: user.collections.get(name).id
        });
      }
      result = await sqlite.executeSql(`delete from collection where name = '${name}';`)
      this.collections.delete(name);
      this.open.splice(this.open.indexOf(name), 1);
    },
    async addMany(name, cards, onconflict = 'update') {
      let values = [];
      let mappings = [];

      for (const card of cards) {
        values.push(`('${card.id}', '${this.prepareJson(card.data)}')`)
        mappings.push(`('${name}', '${card.id}', ${card.count}, '${card.finish}')`)
      }
      await sqlite.executeSql(`
        insert into card(id, data) 
        values
        ${values.join(',')}
        on conflict(id) do update set data=EXCLUDED.data
      `)

      let conflict = 'do update set count=EXCLUDED.count'
      if (onconflict === 'add') {
        conflict = 'do update set count = count + EXCLUDED.count'
      }

      await sqlite.executeSql(`
        insert into collection_card(collection_name, card_id, count, finish)
        values
        ${mappings.join(',')}
        on conflict(collection_name, card_id, finish) ${conflict}
      `)
    },
    async save(name, cards) {
      let now = Date.now();

      await sqlite.executeSql(`insert into collection(name) values ('${name}') on conflict do nothing;`);
      if (Object.keys(cards).length > 0) {
        await this.addMany(name, cards);
      }

      // await db.collections.put({ name: name, cards: cards, lastSync: now });
      if (!this.collections.has(name)) {
        this.collections.set(name, { downloaded: true, lastSync: now });
      }
      return this.all;
    },
    async replaceCard(collection, old, new_) {
      console.log("Not implemented yet");
      // const col = await db.collections.get({ name: collection });
      // let newCards = col.cards.filter(c => c.id !== old.id || c.finish !== old.finish);
      // newCards.push(new_);
      // await db.collections.update(collection, { cards: newCards });
    },
    async deleteCard(collectionNames, card) {
      await sqlite.executeSql(`
        delete from collection_card
        where collection_name = '${collectionNames[[0]]}'
        and card_id = '${card.id}';
      `);
    },
    async get(name) {
      const cards = await this.getCards([name]);
      return {
        'name': name,
        'cards': cards,
      };
    },
    async load(names) {
      // this.open = names;
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
    asParams(params) {
      return params.map(item => `'${item}'`).join(', ')
    },
    safeStrings(obj) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];

          if (typeof value === 'string') {
            obj[key] = value.replace(/'/g, "''")
          }

          if (typeof value === 'object' && value !== null) {
            this.safeStrings(value);
          }
        }
      }
    },
    prepareJson(obj) {
      this.safeStrings(obj);
      return JSON.stringify(obj);
    },
    async getCards(names) {
      result = await sqlite.executeSql(`
        select collection_card.card_id, card.data, sum(collection_card.count) as count, collection_card.finish
        from collection_card
        join card on card.id = collection_card.card_id
        where collection_card.collection_name in (${this.asParams(names)})
        group by collection_card.card_id, collection_card.finish
      `);
      let re = [];
      for (const card of result) {
        let data = JSON.parse(card.data);
        data.count = card.count;
        if (card.count > 1) {
        }
        data.finish = card.finish;
        re.push(data);
      }
      return re;
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
