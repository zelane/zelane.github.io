import { defineStore, acceptHMRUpdate } from 'pinia';
import Fuse from 'fuse.js';
import { useCollections } from './collections';
import { cachedGet } from '../utils/network';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const superTypes = ['Planeswalker', 'Legendary Creature', 'Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Token'];

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
};

const config = {
  state: () => {
    return {
      cards: [],
      filtered: [],
      count: 0,
      value: 0,
      keywords: [],
      sets: [],
      tags: new Set(),
      tribes: [],
      loading: false,
      filters: {
        colours: { colours: [], or: false },
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
        ors: {},
        finish: null,
        border: null,
      },
      sort: {
        val: 'Price',
        dir: 1,
      },
    };
  },
  getters: {
    // count(state) {
    //   return [...state.filtered.values()].reduce((total, card) => {
    //     return total += card.count;
    //   }, 0);
    // },
    sorted(state) {
      return state.cards.sort(dynamicSort(state.sort));
    }
  },
  actions: {
    async applyFilters() {
      const collections = useCollections();
      let _filters = this.filters;
      // let to = setTimeout(() => this.loading = true, 300);
      let filtered = this.sorted;

      if (_filters.group) {
        filtered = filtered.reverse();
      }
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

      let count = 0;
      let total_value = 0;
      let distinctNames = new Set();
      filtered = filtered.filter((card) => {
        // return card.border_color == 'borderless';
        // if(card.border_color === 'borderless' || card.full_art === true) return false;
        // return card.frame == '2003';
        // return card.full_art == true;
        if (_filters.group === true && distinctNames.has(card.name)) {
          return false;
        }
        else if (card.price != 0) {
          distinctNames.add(card.name);
        }
        if (_filters.dupesOnly === true && card.count === 1) {
          return false;
        }
        const hasFinish = !_filters.finish || card.finish === _filters.finish;
        if (!hasFinish) return false;
        const hasName = !_filters.name || !_filters.name != '' || card.name.toLowerCase().includes(_filters.name.toLowerCase());
        if (!hasName) return false;

        const colourF = (f) => _filters.colours.or ? _filters.colours.colours.every(f) : _filters.colours.colours.some(f);
        if (_filters.colours.colours.length > 0) {
          // return _filters.colours.colours.sort().join(",") === card.color_identity.sort().join(",");
          const hasColour = colourF((colour) => {
            if (colour === 'C') {
              return card.color_identity.length === 0;
            }
            return (card.color_identity || []).includes(colour);
          });
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

        const hasBorder = _filters.border ? card.border_color == _filters.border : true;
        if (!hasBorder) return false;

        total_value += card.price * (card.count || 1);
        count += parseInt(card.count || 1);
        return true;
      });

      total_value = parseInt(total_value);
      // count = filtered.length;
      // clearTimeout(to);
      this.filtered = filtered;
      this.count = count;
      this.value = total_value;
      this.loading = false;
    },
    delete(cardId) {
      this.cards = this.cards.filter(c => c.id !== cardId);
      this.filtered = this.cards.filter(c => c.id !== cardId);
    },
    add(card) {
      this.cards.push(card);
      this.filtered.push(card);
    },
    addMany(cards) {
      this.cards = [];
      this.filtered = [];
      const _keywords = new Set();
      const _sets = [];
      const tags = new Set();
      let ex = 0.9;

      cards.forEach(card => {
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
        if (card.keywords) {
          card.keywords.forEach((kw) => {
            _keywords.add(kw);
          });
        }
        else {
          console.log(card);
        }
        _sets[card.set] = card.set_name;
        if (card.tags) {
          card.tags.forEach(tag => {
            tags.add(tag);
          });
        }
        card.type_line = card.type_line || '';
        card.type = superTypes.filter(t => card.type_line.includes(t))[0];
        this.add(card);
      });
      // this.filters = {};

      this.keywords = [..._keywords];
      this.sets = Object.keys(_sets).map((key) => ({ set: key, setName: _sets[key] }));
      this.tags = tags;
      this.applyFilters();
    },
    async loadSearch(query, unique='card', force=false) {
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
      // await _loadSearch('e:' + setId, 'prints', force);
      let json = await cachedGet(cache, `${backendUrl}/set/?set=` + setId, force);
      this.addMany(json.data);
    },
    async loadCollections(names) {
      this.loading = true;
      const collections = useCollections();
      collections.open = names;
      let colCards = await collections.getCards(names);
      if (names.length === 0) {
        this.cards = [];
        this.filtered = [];
      }
      else {
        this.addMany(colCards);
      }
      this.loading = false;
    }
  },
};

export const useCardView = defineStore('cardView', config);
export const usePrintsView = defineStore('printsView', config);
export const useSearchView = defineStore('searchView', config);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCardView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(usePrintsView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(useSearchView, import.meta.hot));
}
