import { defineStore, acceptHMRUpdate } from 'pinia';
import Dexie from 'dexie';
import { post, _delete } from '../utils/network';
import { useUser } from '../stores/user';

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
    },
    obj(state) {
      let o = [];
      for(const [k, v] of state.collections.entries()) {
        v.name = k;
        o.push(v);
      }
      return o;
    }
  },
  actions: {
    async init() {
      db.collections.toCollection().each(col => {
        if(col.name === 'clipboard') return;
        this.collections.set(col.name, {
          lastSync: 0,
          downloaded: true,
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
      if(user.collections.has(name)) {
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
      await db.collections.put({ name: name, cards: cards });
      if (!this.collections.has(name)) {
        this.collections.set(name, {downloaded: true, lastSync: 0});
      }
      return this.all;
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
      if(!names) return;

      const user = useUser();
      for(const name of names) {
        const co = this.collections.get(name);
        if (co && !co.downloaded) {
          await this.download(user.collections.get(name).id);
        }
      }
      return await this.getCards(names);
    },
    async getCards(names) {
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
