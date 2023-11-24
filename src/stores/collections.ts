import { defineStore, acceptHMRUpdate } from 'pinia';
import { post, _delete } from '../utils/network';
import { useUser } from './user';
import sqlite from '../utils/db'
import { Card, ScryCard } from '../models/Card';
import { deepUnref } from 'vue-deepunref';
import { cardsToText } from '../utils/formatters';

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
      const result = await sqlite.executeSql(`
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
        const results = await sqlite.executeSql(`select card_id from collection_card where collection_name = '${name}'`)
        const ids = results.map(row => row['card_id']);

        const resp = await post(backendUrl + "/prices", {
          data: ids
        });

        // await sqlite.executeSql('begin transaction');
        for (const [id, price] of Object.entries(resp['data'])) {
          await sqlite.executeSql(`
            update card
            set data = json_set(data, '$.prices', json('${JSON.stringify(price)}'))
            where id = '${id}'
        `)
        }
        // await sqlite.executeSql('commit transaction');
      }
    },
    async delete(name: string) {
      const user = useUser();
      if (user.collections.has(name)) {
        await _delete(backendUrl + '/collection', {
          id: user.collections.get(name).id
        });
      }
      await sqlite.executeSql(`delete from collection where name = '${name}';`)
      await sqlite.executeSql(`delete from collection_card where collection_name = '${name}';`)
      this.collections.delete(name);
      this.open.splice(this.open.indexOf(name), 1);
    },
    async addMany(name: string, cards: Card[], onconflict: string = 'update'): Promise<void> {
      let values = [];
      let mappings = [];
      cards = cards.map(deepUnref)

      for (const card of cards) {
        values.push(`('${card.id}', json('${this.prepareJson(card.data)}'))`)
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
    async empty(name) {
      await sqlite.executeSql(`delete from collection_card where collection_name = '${name}'`)
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
        where collection_name = '${collectionNames[0]}'
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
    async load(names: string[]): Promise<Card[]> {
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
    unpackCard(card) {
      return {
        id: card.id,
        finish: card.finish || 'nonfoil',
        count: card.count || 1,
        data: card,
      }
    },
    // remove
    prepCardRows(rows): Card[] {
      let re = []
      for (const card of rows) {
        try {
          re.push({
            id: card.card_id,
            finish: card.finish,
            count: card.count,
            data: JSON.parse(card.data) as ScryCard
          });
        }
        catch (e) {
          console.error(e);
          continue
        }
      }
      return re
    },
    async getCardIds(names: string[]) {
      const result = await sqlite.executeSql(`
        select distinct(collection_card.card_id), card.data->>'oracle_id' as oracle_id
        from collection_card
        join card on collection_card.card_id = card.id
        where collection_card.collection_name in (${this.asParams(names)})
      `)
      interface CardIds {
        card_id: string,
        oracle_id: string
      }
      return result as CardIds[];
    },
    async getByOracleId(names: string[], oracle_id: string): Promise<Card[]> {
      const result = await sqlite.executeSql(`
        select card.data, sum(collection_card.count) as count, collection_card.finish
        from collection_card
        join card on card.id = collection_card.card_id
        where collection_card.collection_name in (${this.asParams(names)})
        and card.data->>'oracle_id' = '${oracle_id}'
        group by collection_card.card_id, collection_card.finish
      `);
      return this.prepCardRows(result)
    },
    async getCards(names: string[]): Promise<Card[]> {
      const result = await sqlite.executeSql(`
        select collection_card.card_id, card.data, sum(collection_card.count) as count, collection_card.finish
        from collection_card
        join card on card.id = collection_card.card_id
        where collection_card.collection_name in (${this.asParams(names)})
        group by collection_card.card_id, collection_card.finish
      `);
      return this.prepCardRows(result)
    },
    async upload(userToken: string, name: string) {
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
    async download(id: string) {
      try {
        const resp = await fetch(backendUrl + '/collection?id=' + id);
        const json = await resp.json();
        await this.save(json.data.name, json.data.cards.map(this.unpackCard));
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
