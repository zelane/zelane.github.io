import { defineStore, acceptHMRUpdate } from 'pinia';
import { cachedGet } from '../utils/network';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const useMeta = defineStore('meta', {
  state: () => {
    return {
      _sets: new Map(),
      precons: [],
      types: [],
      symbols: new Map(),
      cacheKeys: new Map(),
    };
  },
  getters: {
    setIds(state) {
      return new Set(state._sets.keys());
    },
    sets(state) {
      return [...state._sets.values()];
    }
  },
  actions: {
    async init() {
      // let cacheKeys = await (await fetch(backendUrl + "/cacheKeys")).json();
      // this.cacheKeys = new Map(Object.entries(cacheKeys));

      const cache = await caches.open('cardDataCache');

      // Load sets
      let sets = await cachedGet(cache, 'https://api.scryfall.com/sets', true);
      sets.data.forEach(set => {
        if (set.digital) return;
        this._sets.set(set.code, set);
      });

      // Load types
      let types = await cachedGet(cache, 'https://api.scryfall.com/catalog/creature-types');
      this.types = types.data.concat(['Enchantment', 'Sorcery', 'Land', 'Creature', 'Instant', 'Artifact']);

      // Load symbols
      let symbols = await cachedGet(cache, 'https://api.scryfall.com/symbology ');
      symbols.data.forEach(s => {
        this.symbols.set(s.symbol, s.svg_uri);
      });
      // this.symbols = symbols.data;

      // Load precons
      let precons = await cachedGet(cache, `${backendUrl}/precons`, true);
      precons.data.sort((a, b) => Date.parse(a.releaseDate) < Date.parse(b.releaseDate) ? 1 : -1);
      let groups = {};
      for (const pc of precons.data) {
        let set = this._sets.get(pc.set).name;
        if (groups[set]) {
          groups[set].push(pc);
        }
        else {
          groups[set] = [pc];
        }
      }
      this.precons = [];
      for (const [k, v] of Object.entries(groups)) {
        this.precons.push({ label: k, options: v });
      };
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMeta, import.meta.hot));
}
