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
    type: Object,
    default: () => {
      return {val: 'Price', dir: -1};
    }
  },
  db: {
    type: Object,
    default: () => {}
  },
  filters: {
    type: Object,
    default: () => {}
  }
});
const emit = defineEmits(['change', 'loading']);

let vars = reactive({ keywords: [], sets: [], tribes: [], allSets: [], tags: new Set() });

let filters = reactive({
  colours: {colours:[], or: false}, 
  rarity: [], 
  foils: false, 
  keywords: [], 
  tribes: [], 
  name: '', 
  cardText: '', 
  sets: [], 
  tags: [],
  mana: {value: [null, null], min: 0, max: 20}, 
  price:{value: [null, null], min: 0, max: 100}, 
  dupesOnly: false, 
  sort: {
    val: 'Price',
    dir: 1,
  },
  group: false,
  incCol: {}, 
  excCol: {}, 
  ors: {}
});

const rarities = ['special', 'mythic', 'rare', 'uncommon', 'common'];
const superTypes = ['Planeswalker', 'Legendary Creature', 'Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Token'];

watch(prop.filters, (f) => {
  // console.log({...f});
  filters.sets = f.sets;
  // for(const [k, v] of Object.entries(f)) {
  //   if(v) {
  //     filters[k] = v;
  //   }
  // }
});

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
;
caches.open('cardDataCache').then(async (cache) => {
  let ts = await cachedGet(cache, 'https://api.scryfall.com/catalog/creature-types');
  vars.tribes = ts.data;
  vars.tribes = vars.tribes.concat(['Enchantment', 'Sorcery', 'Land', 'Creature', 'Instant', 'Artifact']);
  let as = await cachedGet(cache, 'https://api.scryfall.com/sets');
  vars.allSets = as.data;
});

const dynamicSort = (a, b) => {
  const dir = filters.sort.dir;
  if (filters.sort.val === 'Price') {
    if (!a.price) {
      return true;
    }
    return a.price < b.price ? dir : dir * -1;
  }
  else if (filters.sort.val === 'Mana') {
    return parseFloat(a.cmc) < parseFloat(b.cmc) ? dir : -1 * dir;
  }
  else if (filters.sort.val === 'Count') {
    if(parseFloat(a.count) === parseFloat(b.count)) {
      return a.price < b.price ? 1 : -1;
    }
    return parseFloat(a.count) < parseFloat(b.count) ? dir : -1 * dir;
  }
  else if (filters.sort.val === 'Released') {
    let ad = new Date(a.released_at + "T00:00:00");
    let bd = new Date(b.released_at + "T00:00:00");
    return ad.getTime() > bd.getTime() ? dir : dir * -1;
  }
  else if (filters.sort.val === 'Type') {
    if(a.type === b.type) {
      return parseFloat(a.cmc) > parseFloat(b.cmc) ? dir : dir * -1;
    }
    return superTypes.indexOf(a.type) > superTypes.indexOf(b.type) ? dir : dir * -1;
  }
};

const filterCards = async (cards, _filters) => new Promise(async resolve => {
  let to = setTimeout(() => emit("loading"), 300);
  let filtered = cards.sort(dynamicSort);
  if(_filters.group) {
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
  let distinctNames = new Set();
  filtered = filtered.filter((card) => {
    // return card.border_color == 'borderless';
    // if(card.border_color === 'borderless' || card.full_art === true) return false;
    // return card.frame == '2003';
    // return card.full_art == true;
    if(_filters.group === true && distinctNames.has(card.name)) {
      return false;
    }
    distinctNames.add(card.name);
    if (_filters.dupesOnly === true && card.count === 1) {
      return false;
    }
    const hasFinish = !_filters.finish || card.finish === _filters.finish;
    if(!hasFinish) return false;
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

    let hasTags = true;
    if(_filters.tags.length > 0) {
      hasTags = _filters.tags.some(tag => (card.tags || []).includes(tag));
    }
    if (!hasTags) return false;

    const hasMana = card.cmc >= (_filters.mana.value[0] || 0) && card.cmc <= (_filters.mana.value[1] || 20);
    if (!hasMana) return false;

    const haPrice = card.price >= (_filters.price.value[0] || 0) && card.price <= (_filters.price.value[1] || 9999);
    if (!haPrice) return false;

    total_value += card.price * (card.count || 1);
    // info.count += parseInt(card.count);
    return true;
  });
  if(_filters.group) {
    filtered = filtered.sort(dynamicSort);
  }

  total_value = parseInt(total_value);
  count = filtered.length;
  clearTimeout(to);
  resolve([filtered, count, total_value]);
});

watch(() => prop.cards, async (a, b) => {
  const _keywords = new Set();
  const _sets = [];
  const tags = new Set();
  let ex = 0.9;

  a.forEach(card => {
    if(card.prices === undefined) {
      card.price = 0;
    }
    else if(card.finish === 'foil' || card.finish === 'etched' || (card.prices.eur === null && card.prices.usd === null)) {
      if(card.prices.usd_etched !== null) {
        card.price = parseFloat(card.prices.usd_etched);
        if(!card.finish) card.finish = 'etched';
      }
      else if (card.prices.eur_foil || card.prices.usd_foil) {
        card.price = parseFloat(card.prices.eur_foil) || (parseFloat(card.prices.usd_foil) * ex) || 0;
        if(!card.finish) card.finish = 'foil';
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
    if(card.keywords) {
      card.keywords.forEach((kw) => {
        _keywords.add(kw);
      });
    }
    else {
      console.log(card);
    }
    _sets[card.set] = card.set_name;
    if(card.tags) {
      card.tags.forEach(tag => {
        tags.add(tag);
      });
    }
    card.type_line = card.type_line || '';
    card.type = superTypes.filter(t => card.type_line.includes(t))[0];
  });
  // Have to clear filters that depend on dynamic filters, could just load all options?
  filters.keywords = [];
  filters.sets = [];
  vars.keywords = [..._keywords];
  vars.sets = Object.keys(_sets).map((key) => ({ set: key, setName: _sets[key] }));
  vars.tags = tags;

  let [filtered, count, value] = await filterCards(a, filters);
  emit('change', filtered, count, value);
});

watch(() => prop.sort.val, (a, b) => {
  filters.sort.val = a;
});
watch(() => prop.sort.dir, (a, b) => {
  filters.sort.dir = a;
});

let to = null;
watch(filters, async () => {
  clearTimeout(to);
  to = setTimeout(async () => {
    let [filtered, count, value] = await filterCards(prop.cards, filters);
    emit('change', filtered, count, value);
  }, 500);
});

</script>

<template>
  <Colours v-model="filters.colours" />

  <div class="filter-group rarities">
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
    <input
      type="search"
      v-model="filters.name"
      placeholder="Name"
    >
  </div>

  <div class="filter-group mana">
    <input
      type="number"
      v-model="filters.mana.value[0]"
      placeholder="Mana (min)"
    >
    <input
      type="number"
      v-model="filters.mana.value[1]"
      placeholder="Mana (max)"
    >
  </div>

  <div class="filter-group price">
    <input
      type="number"
      v-model="filters.price.value[0]"
      placeholder="Price (min)"
    >
    <input
      type="number"
      v-model="filters.price.value[1]"
      placeholder="Price (max)"
    >
  </div>
  <div class="filter-group">
    <Multiselect
      v-model="filters.tribes"
      :options="vars.tribes"
      :searchable="true"
      mode="tags"
      :create-option="true"
      placeholder="Types"
    />
  </div>

  <div class="filter-group">
    <Multiselect
      v-model="filters.keywords"
      :options="vars.keywords"
      :searchable="true"
      mode="tags"
      placeholder="Keywords"
    />
  </div>

  <div class="filter-group">
    <input
      type="search"
      v-model="filters.cardText"
      placeholder="Card text"
    >
  </div>

  <div class="filter-group">
    <Multiselect
      v-model="filters.sets"
      :options="vars.sets"
      label="setName"
      value-prop="set"
      :searchable="true"
      mode="tags"
      placeholder="Sets"
    />
  </div>

  <div class="filter-group">
    <Multiselect
      v-model="filters.tags"
      :options="[...vars.tags]"
      :searchable="true"
      mode="tags"
      placeholder="Tags"
    />
  </div>

  <div
    class="filter-group compare"
    v-if="collections.length > 0"
  >
    <div class="header">
      <h3>Compare</h3>
      <a
        href="#"
        @click="() => {filters.incCol = {}; filters.excCol = {};}"
      >X</a>
    </div>
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
  
  <Multiselect
    v-model="filters.finish"
    :options="['nonfoil', 'foil', 'etched']"
    mode="single"
    placeholder="Finish"
  />

  <div class="filter-group">
    <h3>Other</h3>
    <label for="group">Group</label>
    <input
      id="group"
      type="checkbox"
      v-model="filters.group"
    >
  </div>
</template>

<style scoped>
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
/* .mana {
  padding: 0 10px;
}
.mana input {
  min-width: 0;
} */

.price, .mana {
  display: grid;
  gap: 0 .5rem;
  grid-template-columns: auto auto;
}
.price h3, .mana h3 {
  grid-column: span 2;
}

.rarities {
  display: flex;
  gap: 0 .5rem;
}
.rarities {
  gap: 0 .5rem;
}
.rarities input[type="checkbox"]:checked + label {
  opacity: 1;
}
.rarities .input-group {
  min-width: 40px;
}
.rarities input[type="checkbox"] {
  display: none;
}
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
  margin: auto;
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

@media (max-width: 640px) {
}

</style>