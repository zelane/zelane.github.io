import { defineStore, acceptHMRUpdate } from 'pinia';
import Dexie from 'dexie';
import { post, _delete } from '../utils/network';
import { useUser } from '../stores/user';
import { useDB } from '../utils/db';

const backendUrl = import.meta.env.VITE_BACKEND_URL;


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
      this.collections.set('test', {
        lastSync: 0,
        downloaded: true,
        image: null,
        count: 0
      })
      // db.collections.toCollection().each(col => {
      //   if (col.name === 'clipboard') return;
      //   this.collections.set(col.name, {
      //     lastSync: col.lastSync || 0,
      //     downloaded: true,
      //     image: col.cards[0]?.image_uris?.art_crop || "https://cards.scryfall.io/art_crop/front/7/e/7e78b70b-0c67-4f14-8ad7-c9f8e3f59743.jpg?1562614382",
      //     count: col.cards.length
      //   });
      // });
    },
    async refreshPrices() {
      return
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
        user.collections.delete(name);
      }
      // await db.collections.delete(name);
      this.collections.delete(name);
      this.open.splice(this.open.indexOf(name), 1);
    },
    async save(name, cards) {
      const db = useDB();
      console.log(cards);
      db.exec([
        // `insert into collection values ("${name}") on conflict(name) do nothing;`,
        `insert into collection (name) values ('${name}') on conflict(name) do nothing;`,
      ])

      for (let card of cards) {
        db.exec([
          `insert into card values ('${card.id}', '${card.name}', '${card.set}', '${card.collector_number}', '${JSON.stringify(card)}') on conflict(id) do nothing;`,
          `insert into collection_card (collection_name, card_id) values ('${name}', '${card.id}') on conflict(collection_name, card_id) count = count + 1;`
        ])
      }
      return

      let now = Date.now();
      // await db.collections.put({ name: name, cards: cards, lastSync: now });
      if (!this.collections.has(name)) {
        this.collections.set(name, { downloaded: true, lastSync: now });
      }
      return this.all;
    },
    async replaceCard(collection, old, new_) {
      return

      const col = await db.collections.get({ name: collection });
      let newCards = col.cards.filter(c => c.id !== old.id || c.finish !== old.finish);
      newCards.push(new_);
      // await db.collections.update(collection, { cards: newCards });
    },
    async deleteCard(collectionNames, card) {
      return
      for (const colName of collectionNames) {
        const col = await db.collections.get({ name: colName });
        const newCards = col.cards.filter(c => c.id !== card.id || c.finish !== card.finish);
        // await db.collections.update(colName, { cards: newCards });
      }
    },
    async get(name) {
      return {};
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
      const db = useDB();
      console.log("Loading", names[0])
      const cards = db.selectObjects(`
        select data from card
        join collection_card on collection_card.card_id = card.id
        where collection_card.collection_name = '${names[0]}'
      `)
      console.log(cards.map(c => JSON.parse(c.data)));
      return cards.map(c => JSON.parse(c.data))
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
