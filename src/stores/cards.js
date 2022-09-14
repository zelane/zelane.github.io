import { defineStore, acceptHMRUpdate } from 'pinia';
import Fuse from 'fuse.js';
import { useCollections } from './collections';
import { cachedGet } from '../utils/network';
import { deepUnref } from 'vue-deepunref';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const superTypes = ['Planeswalker', 'Legendary Creature', 'Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Token'];
const formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

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
      filtered: [],
      tribes: [],
      loading: false,
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
        group: false,
        incCol: [],
        excCol: [],
        cmpCol: [],
        ors: {},
        finish: null,
        border: null,
        quantity: { value: [null, null], min: 0, max: 100 },
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
      return [... state.cards.values()].sort(dynamicSort(state.sort));
    },
    grouped(state) {
      let grouped = new Map();
      for (const card of state.cards.values()) {
        let existing = grouped.get(card.name);
        let price = card.price > 0 ? card.price : Infinity;
        if (existing) {
          existing.count += (card.count || 1);
          grouped.set(card.name, existing);
        }
        if (!existing || existing.price > price || (existing.price === 0 && card.price !== 0)) {
          existing = { ...card };
          grouped.set(card.name, existing);
        }
      }
      return [... grouped.values()].sort(dynamicSort(state.sort));
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
      return [... keywords];
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
      return tags;
    },
    sets(state) {
      let sets = new Map();
      state.filtered.forEach(card => {
        if (!sets.has(card.set)) {
          sets.set(card.set, card.set_name);
        }
      });
      return Object.fromEntries(sets);
    }
  },
  actions: {
    async _compare(cards, collectionNames) {
      const collections = useCollections();
      const colCards = await collections.getCards(collectionNames);
      const ids = colCards.map(c => c.oracle_id);
      cards = cards.forEach(card => {
        this.have.set(card.oracle_id, ids.includes(card.oracle_id));
      });
    },
    _filterColours(card, options) {
      const {mode, colours} = options;
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
      // let to = setTimeout(() => this.loading = true, 300);
      let filtered = _filters.group ? this.grouped : this.sorted;

      if (_filters.cardText && _filters.cardText !== '') {
        const fuse = new Fuse(filtered, {
          ignoreLocation: true,
          threshold: 0.5,
          findAllMatches: true,
          keys: ['oracle_text', 'card_faces.oracle_text'],
        });
        filtered = [];
        fuse.search(_filters.cardText).forEach((item) => {
          filtered.push(item.item);
        });
      }

      this.have.clear();
      if(_filters.cmpCol.length > 0) {
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

        const hasFinish = !_filters.finish || card.finish === _filters.finish;
        if (!hasFinish) return false;
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
      let ex = 0.9;
      if (!card.count) card.count = 1;
      if (card.isCommander) {
        card.finish = 'foil';
      }
      if (card.prices === undefined) {
        card.price = 0;
      }
      else if (card.finish === 'foil' || card.finish === 'etched' || (card.prices.eur === null && card.prices.usd === null)) {
        if (card.prices.usd_etched !== null) {
          card.price = parseFloat(card.prices.usd_etched);
          if (!card.finish) card.finish = 'etched';
        }
        else if (card.prices.eur_foil || card.prices.usd_foil) {
          card.price = parseFloat(card.prices.eur_foil) || (parseFloat(card.prices.usd_foil) * ex) || 0;
          if (!card.finish) card.finish = 'foil';
        }
        else {
          card.finish = 'nonfoil';
          card.price = 0;
        }
      }
      else {
        card.price = parseFloat(card.prices.eur) || (parseFloat(card.prices.usd) * ex) || 0;
        card.finish = 'nonfoil';
      }
      card.type_line = card.type_line || '';
      card.type = superTypes.filter(t => card.type_line.includes(t))[0];

      const existing = this.cards.get(card.id + card.finish);
      if (existing) {
        existing.count += card.count;
      }
      else {
        this.cards.set(card.id + card.finish, {... card});
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
    async loadSearch(query, unique='card', force=false) {
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
      this.loadSearch(`!"${cardName}" -border:silver -is:digital`, 'prints');
    },
    async loadSet(setId, force = false) {
      const cache = await caches.open('cardDataCache');
      // await this.loadSearch('e:' + setId, 'prints', true);
      let json = await cachedGet(cache, `${backendUrl}/set/?set=` + setId, force);
      this.addMany(json.data);
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
    async loadPrecon(name) {
      const cache = await caches.open('cardDataCache');
      const cards = await cachedGet(cache, `${backendUrl}/precon?name=${name}`, true);
      this.addMany(cards.data);
    },
    async loadSync(code) {
      const resp = await fetch(backendUrl + '/collection?id=' + code);
      const json = await resp.json();
      this.addMany(json.data);
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCardView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(usePrintsView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(useSearchView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(useClipboard, import.meta.hot));
}
