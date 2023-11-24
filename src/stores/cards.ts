import { defineStore, acceptHMRUpdate } from 'pinia';
import { useCollections } from './collections';
import { cachedGet } from '../utils/network';
import { deepUnref } from 'vue-deepunref';
import { useMeta } from './meta';
import { Card, ScryCard } from '../models/Card';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const superTypes = ['Planeswalker', 'Legendary Creature', 'Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Token'];
const formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

interface ColourFilterModes {
  mode: 'commander' | 'any' | 'all' | 'exact',
  colours: string[]
}

const dynamicSort = (sort: SortOption) => (a: Card, b: Card): number => {
  const dir = sort.dir;
  if (a.data.isCommander && !b.data.isCommander) return -1
  else if (!a.data.isCommander && b.data.isCommander) return 1

  if (sort.val === 'Price') {
    if (!a.price) {
      return 1;
    }
    return a.price < b.price ? dir : dir * -1;
  }
  else if (sort.val === 'Mana') {
    return a.data.cmc < b.data.cmc ? dir : -1 * dir;
  }
  else if (sort.val === 'Count') {
    if (a.count === b.count) {
      return a.price < b.price ? 1 : -1;
    }
    return a.count < b.count ? dir : -1 * dir;
  }
  else if (sort.val === 'Released') {
    let ad = new Date(a.data.released_at + "T00:00:00");
    let bd = new Date(b.data.released_at + "T00:00:00");
    return ad.getTime() > bd.getTime() ? dir : dir * -1;
  }
  else if (sort.val === 'Type') {
    if (a.data.type === b.data.type) {
      return a.data.cmc > b.data.cmc ? dir : dir * -1;
    }
    return superTypes.indexOf(a.data.type) > superTypes.indexOf(b.data.type) ? dir : dir * -1;
  }
  // else if (sort.val === 'Tag') {
  //   return a.tags[0].localeCompare(b.tags[0]);
  // }
  else if (sort.val === 'Number') {
    return parseInt(a.data.collector_number) > parseInt(b.data.collector_number) ? 1 : -1;
  }
};

interface State {
  cards: Map<String, Card>,
  have: Map<any, any>,
  haveExact: Map<any, any>
  filtered: Card[],
  tribes: string[],
  loading: boolean,
  selected: Set<string>,
  filters: Filters
  sort: SortOption
}

interface SortOption {
  val: string,
  dir: number
}

interface Filters {
  colours: ColourFilterModes,
  rarity: string[],
  keywords: string[],
  tribes: string[],
  name: string,
  cardText: string,
  sets: string[],
  tags: string[],
  mana: RangeFilter,
  price: RangeFilter,
  quantity: RangeFilter,
  group: string,
  incCol: string[],
  excCol: string[],
  cmpCol: string[],
  finish: string,
  frame: string,
  border: string,
  oracle_id: string,
  reprint: string,
  dupesOnly: boolean
}

interface RangeFilter {
  value: number[],
  min: number,
  max: number,
}

const createCardStore = (name: string) => {
  return defineStore(name, {
    state: (): State => {
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
          finish: null,
          frame: null,
          border: null,
          quantity: { value: [null, null], min: 0, max: 100 },
          oracle_id: null,
          reprint: null,
        },
        sort: {
          val: 'Price',
          dir: 1,
        } as SortOption,
      };
    },
    getters: {
      count({ filtered }): number {
        return filtered.reduce((total: number, card: Card) => {
          return total += card.count || 1;
        }, 0);
      },
      value({ filtered }): string {
        const value = filtered.reduce((total: number, card: Card) => {
          return total += card.price * (card.count || 1);
        }, 0);
        return formatter.format(value);
      },
      sorted({ cards, sort }): Card[] {
        return [...cards.values()].sort(dynamicSort(sort));
      },
      grouped({ cards, filters, sort }): Card[] {
        let by = filters.group;
        let grouped = new Map();
        for (const card of cards.values()) {

          let key = ""
          if (by === 'Name') {
            key = card.data.name;
          }
          else if (by === 'ID') {
            key = card.data.oracle_id;
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
        return [...grouped.values()].sort(dynamicSort(sort));
      },
      keywords({ filtered }): string[] {
        let keywords = new Set<string>();
        filtered.forEach((card: Card) => {
          if (card.data.keywords) {
            card.data.keywords.forEach((kw: string) => {
              keywords.add(kw);
            });
          }
        });
        return [...keywords];
      },
      tags({ filtered }): string[] {
        let tags = new Set() as Set<string>;
        filtered.forEach((card: Card) => {
          if (card.tags) {
            card.tags.forEach((kw) => {
              tags.add(kw);
            });
          }
        });
        return [...tags];
      },
      sets({ filtered }): any {
        let sets = new Map<string, string>();
        filtered.forEach((card: Card) => {
          if (!sets.has(card.data.set)) {
            sets.set(card.data.set, card.data.set_name);
          }
        });
        return Object.fromEntries(sets);
      },
      frame_effects({ filtered }): string[] {
        let effects = new Set<string>();
        filtered.forEach((card: Card) => {
          if (card.data.frame_effects) {
            card.data.frame_effects.forEach((e: string) => effects.add(e));
          }
        });
        return [...effects] as string[];
      },
    },
    actions: {
      // Todo: make return the comps instead of modifying globals
      async _compare(cards: Card[], collectionNames: string[]) {
        const collections = useCollections();
        const cids = await collections.getCardIds(collectionNames)
        const oids = cids.map(c => c.oracle_id);
        const ids = cids.map(c => c.card_id);
        cards.forEach((card: Card) => {
          this.have.set(card.data.oracle_id, oids.includes(card.data.oracle_id));
          this.haveExact.set(card.id, ids.includes(card.id))
        });
      },
      _filterColours(card: Card, options: ColourFilterModes): boolean {
        const { mode, colours } = options;
        if (mode === 'commander') {
          let notIn = card.data.color_identity.filter(c => {
            return !colours.includes(c);
          });
          if (Object.keys(card.data.color_identity).length > 0 && notIn.length > 0) {
            return false;
          }
        }
        else if (mode === 'any') {
          return card.data.color_identity.some(c => colours.includes(c));
        }
        else if (mode === 'all') {
          return colours.every(c => card.data.color_identity.includes(c));
        }
        else if (mode === 'exact') {
          return card.data.color_identity.sort().join() === colours.sort().join();
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
          const incIds = includeCards.map(c => c.data.oracle_id);
          filtered = filtered.filter(card => {
            return incIds.includes(card.data.oracle_id);
          });
        }
        if (_filters.excCol.length > 0) {
          const excludedCards = await collections.getCards(_filters.excCol);
          const excIds = excludedCards.map(c => c.data.oracle_id);
          filtered = filtered.filter(card => {
            return !excIds.includes(card.data.oracle_id);
          });
        }

        filtered = filtered.filter((card: Card) => {
          // return card.border_color == 'borderless';
          // if(card.border_color === 'borderless' || card.full_art === true) return false;
          // return card.frame == '2003';
          // return card.full_art == true;

          if (_filters.cardText && _filters.cardText !== '') {
            let text = card.data.oracle_text
            if (text === undefined) {
              text = ""
              for (const face of card.data.card_faces) {
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

          const hasFrame = !_filters.frame || (card.data.frame_effects && card.data.frame_effects.includes(_filters.frame));
          if (!hasFrame) return false;

          const hasName = _filters.name == null || _filters.name == '' || card.data.name.toLowerCase().includes(_filters.name.toLowerCase());
          if (!hasName) return false;

          if (_filters.colours.colours.length > 0) {
            const hasColour = this._filterColours(card, _filters.colours);
            if (!hasColour) return false;
          }

          const hasKeyword = _filters.keywords.every(keyword => (card.data.keywords || []).includes(keyword));
          if (!hasKeyword) return false;

          const hasTribe = _filters.tribes.some(tribe => (card.data.type_line.toLowerCase() || '').includes(tribe.toLowerCase()));
          if (_filters.tribes.length > 0 && !hasTribe) return false;

          const hasRarity = _filters.rarity.length > 0 ? [..._filters.rarity].includes(card.data.rarity) : true;
          if (!hasRarity) return false;

          let hasSet = true;
          if (_filters.sets.length > 0) {
            hasSet = _filters.sets.some((set: string) => card.data.set === set);
          }
          if (!hasSet) return false;

          // let hasTags = true;
          // if (_filters.tags.length > 0) {
          //   hasTags = _filters.tags.some(tag => (card.tags || []).includes(tag));
          // }
          // if (!hasTags) return false;

          const hasMana = card.data.cmc >= (_filters.mana.value[0] || 0) && card.data.cmc <= (_filters.mana.value[1] || 20);
          if (!hasMana) return false;

          // const haPrice = card.price >= (_filters.price.value[0] || 0) && card.price <= (_filters.price.value[1] || 9999);
          // if (!haPrice) return false;

          const hasCount = card.count >= (_filters.quantity.value[0] || 0) && card.count <= (_filters.quantity.value[1] || 9999);
          if (!hasCount) return false;

          const hasBorder = _filters.border ? card.data.border_color == _filters.border : true;
          if (!hasBorder) return false;

          const hasOracleId = _filters.oracle_id ? card.data.oracle_id == _filters.oracle_id : true
          if (!hasOracleId) return false

          const hasReprint = _filters.reprint === null || _filters.reprint == card.data.reprint.toString()
          if (!hasReprint) return false

          return true;
        });

        // count = filtered.length;
        // clearTimeout(to);
        this.filtered = filtered;
        this.loading = false;
      },
      // Todo: Fix
      delete(card: Card) {
        this.cards.delete(card.id + card.finish);
        this.filtered = this.filtered.filter(c => c.id !== card.id || c.finish !== card.finish);
      },
      unifyPrice(card: Card): Card {
        const meta = useMeta();
        if (card.data.isCommander) {
          card.finish = 'foil';
        }
        if (card.data.prices === undefined) {
          card.price = 0;
        }
        else if (card.finish === 'foil' || card.finish === 'etched' || (card.data.prices.eur === null && card.data.prices.usd === null)) {
          if (card.data.prices.usd_etched !== null) {
            card.price = card.data.prices.usd_etched * meta.forex.usd;
            if (!card.finish) card.finish = 'etched';
          }
          else if (card.data.prices.eur_foil || card.data.prices.usd_foil) {
            card.price = card.data.prices.eur_foil * meta.forex.eur || (card.data.prices.usd_foil * meta.forex.usd) || 0;
            if (!card.finish) card.finish = 'foil';
          }
          else {
            card.finish = 'nonfoil';
            card.price = 0;
          }
        }
        else {
          card.price = card.data.prices.eur * meta.forex.eur || (card.data.prices.usd * meta.forex.usd) || 0;
          card.finish = 'nonfoil';
        }
        return card
      },
      convertScryCard(card: ScryCard): Card {
        let re = {
          id: card.id,
          count: 1,
          finish: card.finishes.length === 1 ? card.finishes[0] : 'nonfoil',
          data: card
        } as Card

        // card.type_line = card.type_line || '';
        // card.type = superTypes.filter(t => card.type_line.includes(t))[0];
        return re
      },
      add(card: Card) {
        // Todo fix price for collection cards
        const existing = this.cards.get(card.id + card.finish);
        if (existing) {
          existing.count += card.count;
        }
        else {
          let fixed = this.unifyPrice(card);
          this.cards.set(card.id + card.finish, fixed);
        }
      },
      addMany(cards: Card[]) {
        this.cards.clear();
        this.filtered = [];

        cards.forEach(card => {
          this.add(card);
        });
        this.applyFilters();
      },
      getSelection(): Card[] {
        const cards = [];
        for (const card of this.cards.values()) {
          if (this.selected.has(card.id + card.finish)) {
            cards.push(card);
          }
        }
        return cards;
      },
      async loadSearch(query: string, unique: string = 'card', force: boolean = false) {
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
        let _cards = [] as ScryCard[];
        this.loading = true;
        try {
          while (true) {
            let json = await cachedGet(cache, url, force);
            _cards = _cards.concat(json.data as ScryCard);
            if (!json.has_more) break;
            url = json.next_page;
            await new Promise((r) => setTimeout(r, 100));
          }
          this.addMany(_cards.map(this.convertScryCard));
        }
        finally {
          this.loading = false;
        }
      },
      async loadPrints(cardName: string) {
        this.loadSearch(`!"${cardName}" -border:silver -is:digital`, 'prints', true);
      },
      async loadSet(setId: string, force: boolean = false) {
        this.loading = true;
        const cache = await caches.open('cardDataCache');
        // await this.loadSearch('e:' + setId, 'prints', true);
        let json = await cachedGet(cache, `${backendUrl}/set/?set=` + setId, force);
        this.addMany(json.data.map(this.convertScryCard));
        this.loading = false;
      },
      async loadCollections(names: string[]) {
        this.loading = true;
        const collections = useCollections();
        collections.open = names;
        let cards = await collections.load(names);
        if (names.length === 0) {
          this.cards.clear();
          this.filtered = [];
        }
        else {
          this.addMany(cards);
        }
        this.loading = false;
      },
      async reloadCollections(names: string[]) {
        const collections = useCollections();
        let colCards = await collections.load(names);
        if (names.length === 0) {
          this.cards.clear();
          this.filtered = [];
        }
        else {
          this.addMany(colCards);
        }
      },
      async loadPrecon(name: string) {
        this.loading = true;
        const cache = await caches.open('cardDataCache');
        const cards = await cachedGet(cache, `${backendUrl}/precon?name=${name}`, true);
        this.addMany(cards.data.map(this.convertScryCard));
        this.loading = false;
      },
      async loadSync(code: string) {
        this.loading = true;
        const resp = await fetch(backendUrl + '/collection?id=' + code);
        const json = await resp.json();
        this.addMany(json.data.cards.map(this.convertScryCard));
        this.loading = false;
      },
      async loadVersions(oracle_id: string) {
        const collections = useCollections();
        const cards = await collections.getByOracleId(collections.open, oracle_id);
        this.addMany(cards);
        this.loading = false;
      },
      unrefCards(): Card[] {
        return [... this.cards.values()].map(deepUnref);
      }
    },
  })
};

export const useCardView = createCardStore('cardView');
export const usePrintsView = createCardStore('printsView');
export const useSearchView = createCardStore('searchView');
export const useClipboard = createCardStore('clipboardView');
export const useVersionsView = createCardStore('versionsView');

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCardView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(usePrintsView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(useSearchView, import.meta.hot));
  import.meta.hot.accept(acceptHMRUpdate(useClipboard, import.meta.hot));
}
