import { defineStore, acceptHMRUpdate } from 'pinia';
import Dexie from 'dexie';
import { post } from '../utils/network';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
    all(state) {
      return [... state.collections.keys()].sort();
    }
  },
  actions: {
    async init() {
      db.collections.toCollection().each(col => {
        this.collections.set(col.name, {
          code: col.syncCode,
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
      await db.collections.delete(name);
      this.collections.delete(name);
      this.open.splice(this.open.indexOf(name), 1);
    },
    async save(name, cards, syncCode=null) {
      if(syncCode !== null) {
        await db.collections.put({ name: name, cards: cards, syncCode: syncCode });
      }
      else {
        await db.collections.put({ name: name, cards: cards });
      }
      if (!this.collections.has(name)) {
        this.collections.set(name, {code: syncCode});
      }
      return this.all;
    },
    async saveCode(name, code) {
      await db.collections.update(name, {
        "syncCode": code
      });
      this.collections.get(name).code = code;
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
      return await this.getCards(names);
    },
    async getCards(names) {
      let cardMap = new Map();
      for (const name of names) {
        let collection = await db.collections.get({ name: name });
        if (collection && Object.keys(collection.cards).length > 0) {
          for (const card of collection.cards) {
            if (card === undefined) {
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
    async upload(name) {
      try {
        const collection = await this.get(name);
        let data = {
          cards: collection.cards.map(c => {
            return {
              id: c.id,
              count: c.count,
              tags: c.tags,
              finish: c.finish,
            };
          })
        };
        let code = collection.syncCode;
        if (code) {
          data.id = code;
        }
        const resp = await post(backendUrl + '/collection', data);
        code = resp.data;
        this.saveCode(name, code);
        return code;
      }
      catch (error) {
        console.error(error);
      }
    },
    async download(name, code) {
      try {
        const resp = await fetch(backendUrl + '/collection?id=' + code);
        const json = await resp.json();
        await this.save(name, json.data, code);
      }
      catch (error) {
        console.error(error);
        return false;
      }
      return true;
    },
    async refresh(name) {
      try {
        const collection = await this.get(name);
        if (!collection.syncCode) {
          return;
        }
        const resp = await fetch(backendUrl + '/collection?id=' + collection.syncCode);
        const json = await resp.json();
        this.save(name, json.data, collection.syncCode);
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
