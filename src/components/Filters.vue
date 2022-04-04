<script setup>
import Multiselect from '@vueform/multiselect';
import Slider from '@vueform/slider';
import { reactive, watch } from 'vue';
import Fuse from 'fuse.js';
import Colours from './Colours.vue';

const prop = defineProps({
  cards: {
    type: Array,
    default: () => []
  },
  collections: {
    type: Array,
    default: () => []
  },
  sort: {
    type: String,
    default: 'Price'
  },
  db: {
    type: Object,
    default: () => { }
  },
});
const emit = defineEmits(['change', 'loading']);

let vars = reactive({ keywords: [], sets: [], tribes: [], allSets: [] });

let filters = reactive({
  colours: {colours:[], or: false}, rarity: [], keywords: [], tribes: [], name: '', cardText: '', sets: [], mana: {value: [0, 20], min: 0, max: 20}, price:{value: [0, null], min: 0, max: 100}, dupesOnly: false, sort: 'Price', incCol: {}, excCol: {}, ors: {}
});

const rarities = ['special', 'mythic', 'rare', 'uncommon', 'common'];


const cachedGet = async (cache, url) => {
  const request = new Request(url);
  let response = await cache.match(request);
  if (!response) {
    await cache.add(request);
    response = await cache.match(request);
  }
  const json = await response.json();
  return json;
};

let getCache = null;
caches.open('cardDataCache').then(async (cache) => {
  getCache = cache;
  let ts = await cachedGet(cache, 'https://api.scryfall.com/catalog/creature-types');
  vars.tribes = ts.data;
  vars.tribes = vars.tribes.concat(['Enchantment', 'Sorcery', 'Land', 'Creature', 'Instant', 'Artifact']);
  let as = await cachedGet(cache, 'https://api.scryfall.com/sets');
  vars.allSets = as.data;
});

const dynamicSort = (a, b) => {
  // return parseFloat(a.count) < parseFloat(b.count) ? 1 : -1;
  if (filters.sort === 'Price') {

    if (!a.price) {
      return true;
    }
    return a.price < b.price ? 1 : -1;
  }
  else if (filters.sort === 'Mana') {
    return parseFloat(a.cmc) < parseFloat(b.cmc) ? 1 : -1;
  }
  else if (filters.sort === 'Count') {
    return parseFloat(a.count) < parseFloat(b.count) ? 1 : -1;

  }
};

const filterCards = async (cards, _filters) => new Promise(async resolve => {
  let to = setTimeout(() => emit("loading"), 300);
  let filtered = cards.sort(dynamicSort);

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

  for (const col of Object.keys(_filters.incCol)) {
    if (!_filters.incCol[col]) continue;
    const otherCollection = await prop.db.collections.get({ name: col });
    const ids = otherCollection.cards.map(c => c.oracle_id);
    filtered = filtered.filter(card => {
      return ids.includes(card.oracle_id);
    });
  }

  for (const col of Object.keys(_filters.excCol)) {
    if (!_filters.excCol[col]) continue;
    const otherCollection = await prop.db.collections.get({ name: col });
    const ids = otherCollection.cards.map(c => c.oracle_id);
    filtered = filtered.filter(card => {
      return !ids.includes(card.oracle_id);
    });
  }

  let count = 0;
  let total_value = 0;
  filtered = filtered.filter((card) => {
    // return card.border_color == 'borderless';
    // if(card.border_color === 'borderless' || card.full_art === true) return false;
    // return card.frame == '2003';
    // return card.full_art == true;
    if (_filters.dupesOnly && card.count === 1) {
      return false;
    }

    const hasName = !_filters.name || !_filters.name != '' || card.name.toLowerCase().includes(_filters.name.toLowerCase());
    if (!hasName) return false;
    const colourF = (f) => _filters.colours.or ? _filters.colours.colours.every(f) : _filters.colours.colours.some(f);
    if (_filters.colours.colours.length > 0) {
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

    const hasMana = card.cmc >= _filters.mana.value[0] && card.cmc <= _filters.mana.value[1];
    if (!hasMana) return false;

    const haPrice = card.price >= (_filters.price.value[0] || 0) && card.price <= (_filters.price.value[1] || 9999);
    if (!haPrice) return false;

    total_value += card.price;
    // info.count += parseInt(card.count);
    return true;
  });
  total_value = parseInt(total_value);
  count = filtered.length;
  clearTimeout(to);
  resolve([filtered, count, total_value]);
});

watch(() => prop.cards, async (a, b) => {
  const _keywords = new Set();
  const _sets = [];
  let ex = 0.9;
  // let priceMin = 1000;
  // let priceMax = 0;

  a.forEach(card => {
    card.price = parseFloat(card.prices.eur || parseFloat(card.prices.usd) * ex || 0);
    // if(card.price > priceMax) {
    //   priceMax = card.price;
    // }
    // if(card.price < priceMin) {
    //   priceMin = card.price;
    // }
    card.keywords.forEach((kw) => {
      _keywords.add(kw);
    });
    _sets[card.set] = card.set_name;
  });
  vars.keywords = [..._keywords];
  vars.sets = Object.keys(_sets).map((key) => ({ set: key, setName: _sets[key] }));

  let [filtered, count, value] = await filterCards(a, filters);
  // filters.price.value[0] = priceMin;
  // filters.price.value[1] = priceMax;
  emit('change', filtered, count, value);
});

watch(() => prop.sort, (a, b) => {
  filters.sort = a;
});

let to = null;
watch(filters, async () => {
  clearTimeout(to);
  to = setTimeout(async () => {
    let [filtered, count, value] = await filterCards(prop.cards, filters);
    emit('change', filtered, count, value);
  }, 500);
});

// const coloursChanged = (colours, or) => {
//     filters.colours = colours;
//     filters.ors.colours = or;
// };

// watchEffect(async () => {
//     console.log("cards changed");
//     const _keywords = new Set();
//     const _sets = [];
//     let ex = 0.9;

//     prop.cards.forEach(card => {
//         card.price = parseFloat(card.prices.eur || parseFloat(card.prices.usd) * ex || 0);
//         card.keywords.forEach((kw) => {
//             _keywords.add(kw);
//         });
//         _sets[card.set] = card.set_name;
//     });
//     vars.keywords = [..._keywords];
//     vars.sets = Object.keys(_sets).map((key) => ({ set: key, setName: _sets[key] }));
//     let filtered = await filterCards(prop.cards, filters);
//     emit('change', filtered);
// });

</script>

<template>
  <div>
    <Colours v-model="filters.colours" />

    <div class="filter-group rarities">
      <h3>Rarity</h3>
      <div
        class="input-group rarity"
        :data-rarity="rarity"
        v-for="rarity in rarities"
        :key="rarity"
      >
        <input
          type="checkbox"
          v-model="filters.rarity"
          :value="rarity"
          :id="rarity"
        >
        <label
          :for="rarity"
          :title="rarity"
        />
      </div>
    </div>

    <div class="filter-group">
      <h3>Name</h3>
      <input
        type="search"
        v-model="filters.name"
      >
    </div>

    <div class="filter-group mana">
      <h3>Mana Cost</h3>
      <Slider
        v-model="filters.mana.value"
        :min="filters.mana.min"
        :max="filters.mana.max"
      />
    </div>

    <div class="filter-group price">
      <h3>Avg Price</h3>
      <input type="number" v-model="filters.price.value[0]" placeholder="Min">
      <input type="number" v-model="filters.price.value[1]" placeholder="Max">
      <!-- <Slider
        v-model="filters.price.value"
        :min="filters.price.min"
        :max="filters.price.max"
      /> -->
    </div>

    <div class="filter-group">
      <h3>Types</h3>
      <Multiselect
        v-model="filters.tribes"
        :options="vars.tribes"
        :searchable="true"
        mode="tags"
        :create-option="true"
      />
    </div>

    <div class="filter-group">
      <h3>Keywords</h3>
      <Multiselect
        v-model="filters.keywords"
        :options="vars.keywords"
        :searchable="true"
        mode="tags"
      />
    </div>

    <div class="filter-group">
      <h3>Card text</h3>
      <input
        type="search"
        v-model="filters.cardText"
      >
    </div>

    <div class="filter-group">
      <h3>Set</h3>
      <Multiselect
        v-model="filters.sets"
        :options="vars.sets"
        label="setName"
        value-prop="set"
        :searchable="true"
        mode="tags"
      />
    </div>

    <div
      class="filter-group compare"
      v-if="collections.length > 0"
    >
      <h3>Compare</h3>
      <div class="grid">
        <template
          v-for="col in collections"
          :key="col"
        >
          <div>{{ col }}</div>
          <div>
            <input
              type="checkbox"
              :id="col + '-inc'"
              v-model="filters.incCol[col]"
              :value="false"
            >
            <label
              class="inc"
              :for="col + '-inc'"
            />
          </div>
          <div>
            <input
              type="checkbox"
              :id="col + '-exc'"
              v-model="filters.excCol[col]"
              :value="false"
            >
            <label
              class="exc"
              :for="col + '-exc'"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
.filter-group {
  flex-flow: wrap;
}
.filter-group .header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-group h3 {
  font-family: "Beleren SmallCaps Bold";
  /* font-family: "Spectral"; */
  font-weight: 500;
  font-size: 1rem;
}
.filter-group > h3 {
  margin-bottom: 10px;
  flex-basis: 100%;
}
.filter-group > input {
  width: 100%;
}
.compare .grid {
  display: grid;
  grid-template-columns: 10fr 1fr 1fr;
  line-height: 1rem;
  background-color: var(--colour-input-grey);
  padding: 0.5rem;
  max-height: 11rem;
  overflow: auto;
  gap: 1rem;
}

.compare input[type="checkbox"] {
  display: none;
}
.compare label {
  display: block;
  text-align: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1.5rem;
  line-height: 1.7rem;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--colour-dark-grey);
  font-family: var(--font-magic);
}
.compare label.inc::before {
  content: "+";
}
.compare label.exc::before {
  content: "-";
}
.compare input[type="checkbox"]:checked ~ label.inc {
  color: var(--colour-green);
}
.compare input[type="checkbox"]:checked ~ label.exc {
  color: var(--colour-red);
}
.mana {
  padding: 0 10px;
}
.mana input {
  min-width: 0;
}

.price {
  display: grid;
  gap: 0 .5rem;
  grid-template-columns: auto auto;
}
.price h3 {
  grid-column: span 2;
}

.colours,
.rarities {
  display: flex;
  gap: 0 10px;
}
.rarities {
  gap: 0 15px;
}
.colours input[type="checkbox"]:checked + label,
.rarities input[type="checkbox"]:checked + label {
  opacity: 1;
}
.colours .input-group input[type="checkbox"],
.rarities input[type="checkbox"] {
  display: none;
}
.colour label,
.rarity label {
  display: block;
  width: var(--height-input);
  opacity: 0.5;
  transition: all 0.1s;
  cursor: pointer;
  /* box-shadow: var(--default-shadow); */
}

.rarity label {
  font-size: var(--height-input);
  text-align: center;
  text-shadow: 0px 0px 1px black;
  border-radius: 50%;
  height: 30px;
  width: 30px;
  opacity: 0.3;
}
.colour label {
  color: #938996;
  background-color: transparent;
  height: var(--height-input);
  width: var(--height-input);
  line-height: var(--height-input);
  border-radius: 50%;
  font-size: calc(var(--height-input) - 5px);
  text-align: center;
}
.colour.selected label {
  color: #01121c;
}
.colour[data-colour="R"].selected label {
  color: var(--colour-red);
}
.colour[data-colour="G"].selected label {
  color: var(--colour-green);
}
.colour[data-colour="B"].selected label {
  color: var(--colour-black);
}
.colour[data-colour="U"].selected label {
  color: var(--colour-blue);
}
.colour[data-colour="W"].selected label {
  color: var(--colour-white);
}
.colour[data-colour="C"].selected label {
  color: var(--colour-less);
}

.rarity[data-rarity="mythic"] label {
  color: #bf4427;
  background-color: #de822b;
  /* color: var(--colour-input-grey);
  font-size: 0;
  background: linear-gradient(
    45deg,
    rgba(191, 122, 39, 1) 0%,
    rgba(191, 68, 39, 1) 100%
  );
  border-radius: 50%;
  height: 40px;
  width: 40px;
  display: block; */
}
.rarity[data-rarity="rare"] label {
  color: #a58e4a;
  background-color: #dbc98e;
}
.rarity[data-rarity="uncommon"] label {
  color: #707883;
  background-color: #7a939d;
}
.rarity[data-rarity="common"] label {
  background-color: #efefef;
}
.rarity[data-rarity="special"] label {
  background-color: #d8c6e1;
}
</style>