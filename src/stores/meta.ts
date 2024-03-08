import { defineStore, acceptHMRUpdate } from 'pinia';
import { cachedGet } from '../utils/network';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

interface MSet {
  block: string,
  block_code: string,
  card_count: number,
  code: string,
  digital: false,
  foil_only: false,
  icon_svg_uri: string,
  id: string,
  name: string,
  nonfoil_only: true,
  object: string,
  parent_set_code: string,
  released_at: string,
  scryfall_uri: string,
  search_uri: string,
  set_type: string,
  tcgplayer_id: number,
  uri: string,
}

export const useMeta = defineStore('meta', {
  state: () => {
    return {
      _sets: new Map() as Map<string, MSet>,
      precons: [],
      types: [],
      forex: {
        'usd': 0.78,
        'eur': 0.85,
      },
      symbols: new Map(),
      cacheKeys: new Map(),
    };
  },
  getters: {
    setIds(state) {
      return new Set(state._sets.keys());
    },
    setNames(state) {
      let map = new Map();
      for (const s of state._sets.values()) {
        map.set(s.name, s.code);
      }
      return map;
    },
    sets(state): MSet[] {
      return [...state._sets.values()];
    }
  },
  actions: {
    async getForex(from, to) {
      const resp = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`);
      const forex = await resp.json();
      return forex[from][to];
    },
    async init() {
      // let cacheKeys = await (await fetch(backendUrl + "/cacheKeys")).json();
      // this.cacheKeys = new Map(Object.entries(cacheKeys));
      try {
        this.forex['eur'] = await this.getForex('eur', 'gbp');
        this.forex['usd'] = await this.getForex('usd', 'gbp');
      }
      catch (error) {
        console.error(error)
      }

      const cache = await caches.open('cardDataCache');

      // Load sets
      let sets = await cachedGet(cache, 'https://api.scryfall.com/sets', true);
      sets.data.forEach((set: MSet) => {
        if (set.digital) return;
        this._sets.set(set.code, set);
      });

      // Load types
      let types = await cachedGet(cache, 'https://api.scryfall.com/catalog/creature-types');
      this.types = types.data.concat(['Enchantment', 'Sorcery', 'Land', 'Creature', 'Instant', 'Artifact']);

      // Load symbols
      let symbols = await cachedGet(cache, 'https://api.scryfall.com/symbology', true);
      symbols.data.forEach(s => {
        this.symbols.set(s.symbol, s.svg_uri);
      });
      // this.symbols = symbols.data;

      // Load precons
      let precons = await cachedGet(cache, `${backendUrl}/precons`, true);
      precons.data.sort((a, b) => Date.parse(a.releaseDate) < Date.parse(b.releaseDate) ? 1 : -1);
      let groups = {};
      for (const pc of precons.data) {
        try {
          let set = this._sets.get(pc.set).name;
          if (groups[set]) {
            groups[set].push(pc);
          }
          else {
            groups[set] = [pc];
          }
        }
        catch (error) {
          console.error(error)
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
