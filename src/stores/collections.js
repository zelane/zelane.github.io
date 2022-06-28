import { defineStore, acceptHMRUpdate } from 'pinia';
import Dexie from 'dexie';

const db = new Dexie('mtg');
db.version(3).stores({
  collections: '&name'
});

export const useCollections = defineStore('collections', {
  state: () => {
    return {
      collections: [],
      open: [],
    };
  },
  getters: {
    all(state) {
      return state.collections;
    }
  },
  actions: {
    async init() {
      const collections = await db.collections.toCollection().primaryKeys();
      this.collections = collections.length > 0 ? collections.sort() : [];
    },
    async delete(name) {
      await db.collections.delete(name);
      this.collections.splice(this.collections.indexOf(name), 1);
    },
    async save(name, cards, syncCode=null) {
      if(syncCode !== null) {
        await db.collections.put({ name: name, cards: cards, syncCode: syncCode });
      }
      else {
        await db.collections.put({ name: name, cards: cards });
      }
      if (!this.collections.includes(name)) {
        this.collections.push(name);
      }
      this.collections.sort();
      return this.collections;
    },
    async saveCode(name, code) {
      await db.collections.update(name, {
        "syncCode": code
      });
    },
    async deleteCard(collectionNames, cardId) {
      for (const colName of collectionNames) {
        const col = await db.collections.get({ name: colName });
        const newCards = col.cards.filter(c => c.id !== cardId);
        await db.collections.update(colName, { cards: newCards });
      }
    },
    async get(name) {
      return await db.collections.get({ name: name });
    },
    async getCards(names) {
      this.open = names;
      let cardMap = new Map();
      for (const name of names) {
        let collection = await db.collections.get({ name: name });
        if (collection) {
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
    }
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCollections, import.meta.hot));
}
