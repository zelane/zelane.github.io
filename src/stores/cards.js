import { defineStore, acceptHMRUpdate } from 'pinia';
import { useCollections } from './collections';
import { cachedGet } from '../utils/network';
import { deepUnref } from 'vue-deepunref';
import { useMeta } from './meta';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const superTypes = ['Planeswalker', 'Legendary Creature', 'Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Token'];
const formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

const dynamicSort = (sort) => (a, b) => {
  const dir = sort.dir;
  if (sort.val === 'Price') {
    if (!a.price) {
      return true;
    }
    return a.price < b.price ? dir : dir * -1;
  }
  else if (sort.val === 'Mana') {
    return parseFloat(a.cmc) < parseFloat(b.cmc) ? dir : -1 * dir;
  }
  else if (sort.val === 'Count') {
    if (parseFloat(a.count) === parseFloat(b.count)) {
      return a.price < b.price ? 1 : -1;
    }
    return parseFloat(a.count) < parseFloat(b.count) ? dir : -1 * dir;
  }
  else if (sort.val === 'Released') {
    let ad = new Date(a.released_at + "T00:00:00");
    let bd = new Date(b.released_at + "T00:00:00");
    return ad.getTime() > bd.getTime() ? dir : dir * -1;
  }
  else if (sort.val === 'Type') {
    if (a.type === b.type) {
      return parseFloat(a.cmc) > parseFloat(b.cmc) ? dir : dir * -1;
    }
    return superTypes.indexOf(a.type) > superTypes.indexOf(b.type) ? dir : dir * -1;
  }
  else if (sort.val === 'Tag') {
    return a.tags[0].localeCompare(b.tags[0]);
  }
  else if (sort.val === 'Number') {
    return parseInt(a.collector_number) > parseInt(b.collector_number);
  }
};

const config = {
  state: () => {
    return {
      cards: new Map(),
      have: new Map(),
      haveExact: new Map(),
      filtered: [],
      tribes: [],
      loading: false,
      selected: new Set(),
      filters: {
        colours: { colours: [], mode: 'commander' },
        rarity: [],
        keywords: [],
        tribes: [],
        name: '',
        cardText: '',
        sets: [],
        tags: [],
        mana: { value: [null, null], min: 0, max: 20 },
        price: { value: [null, null], min: 0, max: 100 },
        dupesOnly: false,
        group: null,
        incCol: [],
        excCol: [],
        cmpCol: [],
        ors: {},
        finish: null,
        frame: null,
        border: null,
        quantity: { value: [null, null], min: 0, max: 100 },
        oracle_id: null,
      },
      sort: {
        val: 'Price',
        dir: 1,
      },
    };
  },
  getters: {
    count(state) {
      return state.filtered.reduce((total, card) => {
        return total += parseInt(card.count || 1);
      }, 0);
    },
    value(state) {
      const value = parseInt(state.filtered.reduce((total, card) => {
        return total += card.price * (card.count || 1);
      }, 0));
      return formatter.format(value);
    },
    sorted(state) {
      return [...state.cards.values()].sort(dynamicSort(state.sort));
    },
    grouped(state) {
      let by = state.filters.group;
      let grouped = new Map();
      for (const card of state.cards.values()) {

        let key = ""
        if (by === 'Name') {
          key = card.name;
        }
        else if (by === 'ID') {
          key = card.oracle_id;
        }

        let existing = grouped.get(key);
        let price = card.price > 0 ? card.price : Infinity;

        if (existing) {
          if (existing.price < price || (existing.price === 0 && card.price !== 0)) {
            let count = 0 + existing.count;
            existing = { ...card };
            existing.count = count;
          }
          existing.count += (card.count || 1);
          grouped.set(key, existing);
        }
        else {
          grouped.set(key, { ...card });
        }
        if (!existing || existing.price > price || (existing.price === 0 && card.price !== 0)) {
          existing = { ...card };
          grouped.set(key, existing);
        }
      }
      return [...grouped.values()].sort(dynamicSort(state.sort));
    },
    keywords(state) {
      let keywords = new Set();
      state.filtered.forEach(card => {
        if (card.keywords) {
          card.keywords.forEach((kw) => {
            keywords.add(kw);
          });
        }
      });
      return [...keywords];
    },
    tags(state) {
      let tags = new Set();
      state.filtered.forEach(card => {
        if (card.tags) {
          card.tags.forEach((kw) => {
            tags.add(kw);
          });
        }
      });
      return [...tags];
    },
    sets(state) {
      let sets = new Map();
      state.filtered.forEach(card => {
        if (!sets.has(card.set)) {
          sets.set(card.set, card.set_name);
        }
      });
      return Object.fromEntries(sets);
    },
    frame_effects(state) {
      let effects = new Set();
      state.sorted.forEach(card => {
        if (card.frame_effects) {
          card.frame_effects.forEach(e => effects.add(e));
        }
      });
      return [...effects];
    },
  },
  actions: {
    async _compare(cards, collectionNames) {
      const collections = useCollections();
      const cids = await collections.getCardIds(collectionNames)
      const oids = cids.map(c => c.oracle_id);
      const ids = cids.map(c => c.card_id);
      cards = cards.forEach(card => {
        this.have.set(card.oracle_id, oids.includes(card.oracle_id));
        this.haveExact.set(card.id, ids.includes(card.id))
      });
    },
    _filterColours(card, options) {
      const { mode, colours } = options;
      if (mode === 'commander') {
        let notIn = card.color_identity.filter(c => {
          return !colours.includes(c);
        });
        if (Object.keys(card.color_identity).length > 0 && notIn.length > 0) {
          return false;
        }
      }
      else if (mode === 'any') {
        return card.color_identity.some(c => colours.includes(c));
      }
      else if (mode === 'all') {
        return colours.every(c => card.color_identity.includes(c));
      }
      else if (mode === 'exact') {
        return card.color_identity.sort().join() === colours.sort().join();
      }
      return true;
    },
    async applyFilters() {
      const collections = useCollections();
      let _filters = this.filters;

      let filtered = _filters.group !== null ? this.grouped : this.sorted;

      this.have.clear();
      this.haveExact.clear();

      if (_filters.cmpCol.length > 0) {
        await this._compare(filtered, _filters.cmpCol);
      }
      if (_filters.incCol.length > 0) {
        const includeCards = await collections.getCards(_filters.incCol);
        const incIds = includeCards.map(c => c.oracle_id);
        filtered = filtered.filter(card => {
          return incIds.includes(card.oracle_id);
        });
      }
      if (_filters.excCol.length > 0) {
        const excludedCards = await collections.getCards(_filters.excCol);
        const excIds = excludedCards.map(c => c.oracle_id);
        filtered = filtered.filter(card => {
          return !excIds.includes(card.oracle_id);
        });
      }

      filtered = filtered.filter((card) => {
        // return card.border_color == 'borderless';
        // if(card.border_color === 'borderless' || card.full_art === true) return false;
        // return card.frame == '2003';
        // return card.full_art == true;

        if (_filters.cardText && _filters.cardText !== '') {
          let text = card.oracle_text
          if (text === undefined) {
            text = ""
            for (const face of card.card_faces) {
              text += face.oracle_text
            }
          }
          const re = new RegExp(_filters.cardText);
          if (!re.test(text)) {
            return false;
          }
        }

        const hasFinish = !_filters.finish || card.finish === _filters.finish;
        if (!hasFinish) return false;

        const hasFrame = !_filters.frame || (card.frame_effects && card.frame_effects.includes(_filters.frame));
        if (!hasFrame) return false;

        const hasName = !_filters.name || !_filters.name != '' || card.name.toLowerCase().includes(_filters.name.toLowerCase());
        if (!hasName) return false;

        if (_filters.colours.colours.length > 0) {
          const hasColour = this._filterColours(card, _filters.colours);
          if (!hasColour) return false;
        }

        const hasKeyword = _filters.keywords.every(keyword => (card.keywords || []).includes(keyword));
        if (!hasKeyword) return false;

        const hasTribe = _filters.tribes.some(tribe => (card.type_line.toLowerCase() || '').includes(tribe.toLowerCase()));
        if (_filters.tribes.length > 0 && !hasTribe) return false;

        const hasRarity = _filters.rarity.length > 0 ? [..._filters.rarity].includes(card.rarity) : true;
        if (!hasRarity) return false;

        let hasSet = true;
        if (_filters.sets.length > 0) {
          hasSet = _filters.sets.some((set) => card.set === set);
        }
        if (!hasSet) return false;

        let hasTags = true;
        if (_filters.tags.length > 0) {
          hasTags = _filters.tags.some(tag => (card.tags || []).includes(tag));
        }
        if (!hasTags) return false;

        const hasMana = card.cmc >= (_filters.mana.value[0] || 0) && card.cmc <= (_filters.mana.value[1] || 20);
        if (!hasMana) return false;

        const haPrice = card.price >= (_filters.price.value[0] || 0) && card.price <= (_filters.price.value[1] || 9999);
        if (!haPrice) return false;

        const hasCount = card.count >= (_filters.quantity.value[0] || 0) && card.count <= (_filters.quantity.value[1] || 9999);
        if (!hasCount) return false;

        const hasBorder = _filters.border ? card.border_color == _filters.border : true;
        if (!hasBorder) return false;

        const hasOracleId = _filters.oracle_id ? card.oracle_id == _filters.oracle_id : true
        if (!hasOracleId) return false

        return true;
      });

      // count = filtered.length;
      // clearTimeout(to);
      this.filtered = filtered;
      this.loading = false;
    },
    delete(card) {
      this.cards.delete(card.id + card.finish);
      this.filtered = this.filtered.filter(c => c.id !== card.id || c.finish !== card.finish);
    },
    add(card) {
      const meta = useMeta();
      card.finish = card.finishes.length === 1 ? card.finishes[0] : card.finish;
      if (!card.count) card.count = 1;
      if (card.isCommander) {
        card.finish = 'foil';
      }
      if (card.prices === undefined) {
        card.price = 0;
      }
      else if (card.finish === 'foil' || card.finish === 'etched' || (card.prices.eur === null && card.prices.usd === null)) {
        if (card.prices.usd_etched !== null) {
          card.price = parseFloat(card.prices.usd_etched) * meta.forex.usd;
          if (!card.finish) card.finish = 'etched';
        }
        else if (card.prices.eur_foil || card.prices.usd_foil) {
          card.price = parseFloat(card.prices.eur_foil) * meta.forex.eur || (parseFloat(card.prices.usd_foil) * meta.forex.usd) || 0;
          if (!card.finish) card.finish = 'foil';
        }
        else {
          card.finish = 'nonfoil';
          card.price = 0;
        }
      }
      else {
        card.price = parseFloat(card.prices.eur) * meta.forex.eur || (parseFloat(card.prices.usd) * meta.forex.usd) || 0;
        card.finish = 'nonfoil';
      }
      card.type_line = card.type_line || '';
      card.type = superTypes.filter(t => card.type_line.includes(t))[0];

      const existing = this.cards.get(card.id + card.finish);
      if (existing) {
        existing.count += card.count;
      }
      else {
        this.cards.set(card.id + card.finish, { ...card });
      }
      this.filtered.push({ ...card });
    },
    addMany(cards) {
      this.cards.clear();
      this.filtered = [];

      cards.forEach(card => {
        this.add(card);
      });
      // this.filters = {};

      this.applyFilters();
    },
    getSelection() {
      const cards = [];
      for (const card of this.cards.values()) {
        if (this.selected.has(card.id + card.finish)) {
          cards.push(card);
        }
      }
      return cards;
    },
    async loadSearch(query, unique = 'card', force = false) {
      if (query.length === 0) {
        this.cards.clear();
        return;
      }
      if (query.length < 3) {
        return;
      }
      const cache = await caches.open('cardDataCache');
      let url = 'https://api.scryfall.com/cards/search?' + new URLSearchParams({
        q: `${query} -border:silver -is:digital`,
        unique: unique
      });
      let _cards = [];
      this.loading = true;
      try {
        while (true) {
          let json = await cachedGet(cache, url, force);
          _cards = _cards.concat(json.data);
          if (!json.has_more) break;
          url = json.next_page;
          await new Promise((r) => setTimeout(r, 100));
        }
        this.addMany(_cards);
      }
      finally {
        this.loading = false;
      }
    },
    async loadPrints(cardName) {
      this.loadSearch(`!"${cardName}" -border:silver -is:digital`, 'prints', true);
    },
    async loadSet(setId, force = false) {
      this.loading = true;
      const cache = await caches.open('cardDataCache');
      // await this.loadSearch('e:' + setId, 'prints', true);
      let json = await cachedGet(cache, `${backendUrl}/set/?set=` + setId, force);
      this.addMany(json.data);
      this.loading = false;
    },
    async loadCollections(names) {
      this.loading = true;
      const collections = useCollections();
      collections.open = names;
      let colCards = await collections.load(names);
      if (names.length === 0) {
        this.cards.empty();
        this.filtered = [];
      }
      else {
        this.addMany(colCards);
      }
      this.loading = false;
    },
    async reloadCollections(names) {
      const collections = useCollections();
      let colCards = await collections.load(names);
      if (names.length === 0) {
        this.cards.empty();
        this.filtered = [];
      }
      else {
        this.addMany(colCards);
      }
    },
    async loadPrecon(name) {
      this.loading = true;
      const cache = await caches.open('cardDataCache');
      const cards = await cachedGet(cache, `${backendUrl}/precon?name=${name}`, true);
      this.addMany(cards.data);
      this.loading = false;
    },
    async loadSync(code) {
      this.loading = true;
      const resp = await fetch(backendUrl + '/collection?id=' + code);
      const json = await resp.json();
      this.addMany(json.data.cards);
      this.loading = false;
    },
    async loadVersions(oracle_id) {
      const collections = useCollections();
      const cards = await collections.getByOracleId(collections.open, oracle_id);
      this.addMany(cards);
      this.loading = false;
    },
    unrefCards() {
      return [... this.cards.values()].map(deepUnref);
    }
  },
};

export const useCardView = defineStore('cardView', config);
export const usePrintsView = defineStore('printsView', config);
export const useSearchView = defineStore('searchView', config);
export const useClipboard = defineStore('clipboardView', config);
export const useVersionsView = defineStore('versionsView', config);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCardView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(usePrintsView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(useSearchView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(useClipboard, import.meta.hot));
}
