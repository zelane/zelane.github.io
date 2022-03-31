<script setup>
import { reactive, ref, watch } from 'vue';
import Papa from 'papaparse';
import Multiselect from '@vueform/multiselect';
import Slider from '@vueform/slider';
import Dexie from 'dexie';
import Fuse from 'fuse.js';

// defineProps({});

const skyfallUrl = 'https://api.scryfall.com/cards/collection';
const upload = reactive({
  show: false, name: null, file: null, text: null, encoding: null, format: null, active: false, progress: 0, count: 0, total: 0
});
// let upload = reactive({ show: false, name: null, file: null, text: null, encoding: null, format: null, active: true, progress: 50, count: 50, total: 100 })

const db = new Dexie('mtg');
db.version(2).stores({
  collections: '&name'
});

const colours = {
  Red: 'R', Green: 'G', Black: 'B', Blue: 'U', White: 'W', Colourless: 'C',
};
// [ "B", "G", "R", "U", "W" ]
const twoColours = {
    Azorius: ['U', 'W'],
    Boros: ['R','W'],
    Dimir: ['B', 'U'],
    Golgari: ['B','G'],
    Gruul: ['G', 'R'],
    Izzet: ['R', 'U'],
    Orzhov: ['B', 'W',],
    Rakdos: ['B','R'],
    Selesnya: ['G', 'W'],
    Simic: ['G', 'U'],
};
const threeColours = {
    Abzan: ['B', 'G', 'W'],
    Bant: ['G', 'U', 'W'],
    Esper: ['B', 'U', 'W'],
    Grixis: ['B', 'R', 'U'],
    Jeskai: ['R', 'U', 'W'],
    Jund: ['B', 'G', 'R'],
    Mardu: ['B', 'R', 'W'],
    Naya: ['G', 'R', 'W'],
    Sultai: ['B', 'G', 'U'],
    Temur:  ['G', 'R', 'U'],
};
const fourColours = {
    Glint: 'W',
    Dune: 'U',
    Ink: 'B',
    Witch: 'R',
    Yore: 'G',
};
const rarities = ['special', 'mythic', 'rare', 'uncommon', 'common'];
const filterVals = reactive({ tribes: [], keywords: [], sets: [], allSets: [] });
let filters = reactive({
  colours: [], rarity: [], keywords: [], tribes: [], name: '', cardText: '', sets: [], mana: [0, 20], dupesOnly: false, sort: 'Price', incCol: {}, excCol: {}, ors: {}
});
const sorts = ['Mana', 'Price', 'Count'];
const info = reactive({ count: 0, total_value: 0, zoom: 0 });
const clipboard = reactive({show: false, cards: []});
const setIds = new Set();
let loading = ref(false);

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
  let to = setTimeout(() => loading.value = true, 300);
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
    const otherCollection = await db.collections.get({ name: col });
    const ids = otherCollection.cards.map(c => c.oracle_id);
    filtered = filtered.filter(card => {
      return ids.includes(card.oracle_id);
    });
  }

  for (const col of Object.keys(_filters.excCol)) {
    if (!_filters.excCol[col]) continue;
    const otherCollection = await db.collections.get({ name: col });
    const ids = otherCollection.cards.map(c => c.oracle_id);
    filtered = filtered.filter(card => {
      return !ids.includes(card.oracle_id);
    });
  }

  info.count = 0;
  info.total_value = 0;
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

    const colourF = (f) => _filters.ors.colours ? _filters.colours.every(f) : _filters.colours.some(f);
    if(_filters.colours.length > 0) {
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

    const hasMana = card.cmc >= _filters.mana[0] && card.cmc <= _filters.mana[1];
    if (!hasMana) return false;

    info.total_value += card.price;
    // info.count += parseInt(card.count);
    return true;
  });
  info.total_value = parseInt(info.total_value);
  info.count = filtered.length;
  clearTimeout(to);
  loading.value = false;
  resolve(filtered);
});

let allCards = [];
const cards = reactive({ collections: [], value: [] });
let activeCollections = reactive({ value: [] });

const loadCollections = async (names) => {
  if (names === []) {
    return;
  }
  let cards = new Map();
  for(const name of names) {
    let collection = await db.collections.get({ name: name });
    for(const card of collection.cards) {
      if(cards.has(card.id)) {
        let ex = cards.get(card.id);
        ex.count = parseInt(ex.count) + parseInt(card.count);
        cards.set(card.id, ex);
      }
      else {
        cards.set(card.id, card);
      }
    }
  }
  showCards([...cards.values()]);
};

const loadSet = async (setId) => {
  loadSearch('e:' + setId);
};

const loadSearch = async (query, unique='prints') => {
  let url = 'https://api.scryfall.com/cards/search?' + new URLSearchParams({
    q: query + ' -border:silver -is:digital',
    unique: unique
  });
  let cards = [];
  loading.value = true;
  try {
    while (true) {
      let json = await cachedGet(getCache, url);
      cards = cards.concat(json.data);
      if (!json.has_more) break;
      url = json.next_page;
      await new Promise((r) => setTimeout(r, 100));
    }
    showCards(cards);
  }
  finally {
    loading.value = false;
  }
};

const showCards = async (_cards) => {
  allCards = _cards;
  const keywords = new Set();
  const sets = [];
  let ex = 0.9;

  allCards.forEach(card => {
    card.price = parseFloat(card.prices.eur || parseFloat(card.prices.usd) * ex || 0);
    card.keywords.forEach((kw) => {
      keywords.add(kw);
    });
    sets[card.set] = card.set_name;
  });
  filterVals.keywords = [...keywords];
  filterVals.sets = Object.keys(sets).map((key) => ({ set: key, setName: sets[key] }));
  cards.value = await filterCards(allCards, filters);
};

const deleteCollection = async (name) => {
  await db.collections.delete(name);
  cards.collections.pop(name);
  activeCollections.value = [];
};

watch(activeCollections, x => loadCollections(x.value));

let to = null;
watch(filters, async (value) => {
  clearTimeout(to);
  to = setTimeout(async () => {
    cards.value = await filterCards(allCards, value);
  }, 500);
});

db.collections.toCollection().primaryKeys().then(keys => {
  if (keys.length === 0) {
    return;
  }
  cards.collections = keys.sort();
  activeCollections.value = [keys[0]];
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

let getCache = null;
caches.open('cardDataCache').then(async (cache) => {
  getCache = cache;
  let ts = await cachedGet(cache, 'https://api.scryfall.com/catalog/creature-types');
  filterVals.tribes = ts.data;
  filterVals.tribes = filterVals.tribes.concat(['Enchantment', 'Sorcery', 'Land', 'Creature', 'Instant', 'Artifact']);
  let as = await cachedGet(cache, 'https://api.scryfall.com/sets');
  as.data.forEach(set => setIds.add(set.code));
  filterVals.allSets = as.data;
});

const post = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const checkEncoding = async (file) => {
  let arrayBuffer = await file.arrayBuffer();
  let array8 = new Uint8Array(arrayBuffer.slice(0, 10));
  // array8.forEach((x) => {
  // console.log(x.toString(16))
  // })
  if (array8[0].toString(16) == 'ff' && array8[1].toString(16) == 'fe') {
    return 'UTF-16LE';
  }
  else if (array8[0].toString(16) == 'fe' && array8[1].toString(16) == 'ff') {
    return 'UTF-16BE';
  }
  else if (array8[1] == 0 && array8[3] == 0 && array8[5] == 0) {
    return 'UTF-16LE';
  }
  return 'UTF-8';
};

const handleTextUpload = async (e) => {
  upload.active = true;
  upload.progress = 0;
  let cards = {};
  if (upload.format === 'MTGA') {
    const re = /([0-9]+) (.+) \((.+)\) ([0-9]+)/g;
    const matches = upload.text.matchAll(re);
    for (const m of matches) {
      cards[m[3] + m[4]] = {
        name: m[2],
        count: parseInt(m[1]),
        set: m[3],
        number: m[4],
      };
    };
  }
  else if (upload.format === 'MTGO') {
    const re = /([0-9]+) (.+)/g;
    const matches = upload.text.matchAll(re);
    for (const m of matches) {
      cards[m[2]] = {
        name: m[2],
        count: parseInt(m[1]),
        set: '',
        number: '',
      };
    }
  }
  updateCollection(upload.name, cards);
};

const handleFileUpload = async (e) => {
  if (fileElem.value.files.length === 0) {
    return;
  }
  let file = fileElem.value.files[0];
  const reader = new FileReader();
  upload.active = true;
  upload.progress = 0;

  let parser = null;
  if (upload.format === 'DragonShield Web') {
    parser = parseDSWeb;
  }

  reader.onload = async () => {
    let cardList = await parser(reader.result);
    updateCollection(upload.name, cardList);
  };
  let encoding = await checkEncoding(file);
  reader.readAsText(file, encoding);
};

const fileElem = ref(null);

const onFileChange = e => {
  e.preventDefault();
  console.log(e.dataTransfer.items[0].getAsFile());
};

Papa.parsePromise = (file) => {
  return new Promise((complete, error) => {
    Papa.parse(file, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: complete,
      error: error,
    });
  });
};

const parseDSWeb = async (csv) => {
  csv = csv.replace('"sep=,"', '');
  let parsed = await Papa.parsePromise(csv);
  let cards = {};
  parsed.data.forEach(row => {
    const setName = row['Set Name'];
    let setCode = row['Set Code'].toLowerCase();

    // Find set id for mismatched set ids
    if (!setIds.has(setCode)) {
      console.log(`Couldn't find set for ${row['Card Name']} ${row['Card Number']} ${setName} [${setCode}]`);
      cards[setCode + row['Card Number']] = {
        name: row['Card Name'],
        count: parseInt(row['Quantity']),
        set: '',
        number: '',
      };
    }
    else {
      cards[setCode + row['Card Number']] = {
        name: row['Card Name'],
        count: parseInt(row['Quantity']),
        set: setCode,
        number: row['Card Number'].toString(),
      };

    }
  });
  return cards;
};

const updateCollection = async (name, cardList, append=true) => {
  let cardData = [];

  // If collection exists and append, only add new cards, sum counts
  if(append && cards.collections.includes(upload.name)) {
    const collection = await db.collections.get({ name: upload.name });
    cardData = collection.cards;
    for(const [key, card] of Object.entries(cardList)) {
      let existing = collection.cards.filter(c => {
        return (card.set === '' || (card.set === c.set && card.number === c.collector_number)) || c.name === card.name;
      });
      if(existing.length > 0) {
        existing[0].count = card.count;
        delete cardList[key];
      }
    }
  }

  if(cardList) {
    const newData = await fetchCardData(cardList);
    cardData = cardData.concat(newData);
  }
  await db.collections.put({ 'name': name, 'cards': cardData });
  if (!cards.collections.includes(name)) {
    cards.collections.push(name);
  }
  activeCollections.value = [name];
};

const fetchCardData = async (cardList) => {
  const ids = [];
  const counts = {};
  try {
    let cardData = [];

    for(const [key, _card] of Object.entries(cardList)) {
      let elem = {};
      if (_card.set === '' && _card.number === '') {
        elem.name = _card.name;
        counts[_card.name] = _card.count;
      }
      else {
        elem.set = _card.set;
        elem.collector_number = _card.number;
        counts[_card.set + _card.number] = _card.count;
      }
      ids.push(elem);
    };

    upload.total = ids.length;
    for (let i = 0; i < ids.length; i += 75) {
      const resp = await post(skyfallUrl, { identifiers: ids.slice(i, i + 75) });
      if (resp.not_found.length > 0) {
        console.log(resp.not_found);
      }
      let data = resp.data.map(c => {
        c.count = counts[c.name] || counts[c.set + c.collector_number];
        return c;
      });
      cardData = cardData.concat(data);
      upload.count = i;
      upload.progress = (i / ids.length) * 100;
      await new Promise((r) => setTimeout(r, 100));
    }
    upload.progress = 100;
    return cardData;
  }
  catch(e) {
    console.error(e);
  }
  finally {
    upload.active = false;
    upload.count = 0;
    upload.progress = 0;
    upload.total = 0;
    upload.show = false;
  }
};

const exportList = async (format) => {
  let list = "";
  if(format === 'mtgo') {
    cards.value.forEach(card => {
      list += (card.count || 1) + ' ' + card.name + '\n';
    });
  }
  else if (format === 'moxfield') {
    list = '"Count","Tradelist Count","Name","Edition","Condition","Language","Foil","Tags","Last Modified","Collector Number"\n';
    clipboard.cards.forEach(card => {
      list += `"${card.count || 1}","0","${card.name}","${card.set}","Near Mint","English","","","2022-03-22 02:52:33.210000","${card.collector_number}"\n`;
    });
  }
  navigator.clipboard.writeText(list);
};

const matchColours = (colours) => {
  let _colours = [... colours].sort();
  if(colours.length === 2) {
    for(const [key, value] of Object.entries(twoColours)) {
      if(_colours.every((v, i) => v === value[i])) return key;
    }
  }
  else if(colours.length === 3) {
    for(const [key, value] of Object.entries(threeColours)) {
      if(_colours.every((v, i) => v === value[i])) return key;
    }
  }
  else if(colours.length === 4) {
    for(const [key, value] of Object.entries(fourColours)) {
      if(!colours.includes(value)) return key;
    }
  }
};

</script>

<template>
  <div id="window">
    <div id="sidebar">
      <div class="filter-group collections">
        <h3>View Collection</h3>
        <Multiselect
          v-model="activeCollections.value"
          :options="cards.collections"
          mode="tags"
          :can-clear="false"
        />
        <button
          class="small add"
          @click="upload.show = true"
        >
          +
        </button>
        <button
          class="small remove"
          @click="deleteCollection(activeCollection.value)"
        >
          -
        </button>
      </div>

      <div class="filter-group">
        <h3>View Set</h3>
        <Multiselect
          :options="filterVals.allSets"
          label="name"
          value-prop="code"
          :searchable="true"
          mode="single"
          @select="loadSet"
        />
      </div>

      <hr>

      <div class="filter-group colours">
        <div class="header">
          <h3>Colours ({{ filters.colours.length > 1 ? matchColours(filters.colours) : '' }})</h3>
          <div
            class="bi-toggle"
            :class="{active: filters.ors.colours}"
            @click="filters.ors.colours=!filters.ors.colours"
          >
            {{ filters.ors.colours ? "And" : "Or" }}
          </div>
        </div>
        <div
          class="input-group colour"
          :class="filters.colours.includes(code) ? 'selected' : ''"
          :data-colour="code"
          v-for="code in colours"
          :key="code"
        >
          <input
            type="checkbox"
            v-model="filters.colours"
            :value="code"
            :id="code"
          >
          <label
            :for="code"
            :class="'icon icon-' + code"
          />
        </div>
      </div>

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
          v-model="filters.mana"
          :min="0"
          :max="20"
        />
      </div>

      <div class="filter-group">
        <h3>Types</h3>
        <Multiselect
          v-model="filters.tribes"
          :options="filterVals.tribes"
          :searchable="true"
          mode="tags"
          :create-option="true"
        />
      </div>

      <div class="filter-group">
        <h3>Keywords</h3>
        <Multiselect
          v-model="filters.keywords"
          :options="filterVals.keywords"
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
          :options="filterVals.sets"
          label="setName"
          value-prop="set"
          :searchable="true"
          mode="tags"
        />
      </div>

      <div
        class="filter-group compare"
        v-if="cards.collections.length > 0"
      >
        <h3>Compare</h3>
        <div class="grid">
          <template
            v-for="col in cards.collections"
            :key="col"
          >
            <div>{{ col }}</div>
            <div>
              <input
                type="checkbox"
                :id="col+'-inc'"
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
                :id="col+'-exc'"
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

      <div class="filter-group">
        <h3>
          Scryfall Search <a
            href="https://scryfall.com/docs/syntax"
            target="_blank"
          >?</a>
        </h3>
        <input
          type="search"
          @keyup.enter="e => loadSearch(e.currentTarget.value, 'cards')"
        >
      </div>
    </div>

    <div id="main">
      <div
        class="loader"
        v-if="loading"
      >
        Loading
      </div>
      <div
        class="upload"
        v-if="upload.show"
      >
        <button
          class="small close"
          @click="upload.show = false"
        >
          <span>+</span>
        </button>
        <div class="form">
          <h3>Name</h3>
          <input
            type="text"
            v-model="upload.name"
          >
          <h3>Format</h3>
          <Multiselect
            v-model="upload.format"
            :options="['DragonShield Web', 'DragonShield Mobile', 'MTGA', 'MTGO']"
            :can-clear="false"
          />
          <!-- <h3>Encoding</h3>
        <Multiselect
          v-model="upload.encoding"
          :options="['UTF-16LE', 'UTF-16BE', 'UTF-8', 'ascii']"
          />-->
          <template v-if="['MTGA', 'MTGO'].includes(upload.format)">
            <textarea v-model="upload.text" />
          </template>

          <!-- <div
            class="file"
            for="upload"
            @drop="onFileChange"
            @dragenter.prevent
            @dragover.prevent
            @dragover="e => e.preventDefault()"
          ></div>-->

          <label
            class="button"
            for="file-input"
            v-if="['DragonShield Web', 'DragonShield Mobile'].includes(upload.format)"
          >Choose file</label>
          <input
            v-if="upload.format === 'DragonShield Web'"
            id="file-input"
            ref="fileElem"
            type="file"
            :disabled="upload.active"
          >
          <div
            class="buttons"
            v-if="!upload.active && upload.format && (upload.text || fileElem)"
          >
            <button
              @click="['MTGA', 'MTGO'].includes(upload.format) ? handleTextUpload() : handleFileUpload()"
            >
              Upload
            </button>
          </div>

          <div
            class="progress"
            v-if="upload.active"
          >
            <span>Processing cards: {{ upload.count }} / {{ upload.total }}</span>
            <div
              class="bar"
              :style="{ width: upload.progress + '%' }"
            />
          </div>
        </div>
      </div>

      <div class="info-bar">
        <span>Count: {{ info.count }}</span>
        <span>Total Value: {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(info.total_value) }}</span>
        <span>
          <Multiselect
            v-model="filters.sort"
            :options="sorts"
            mode="single"
            :can-clear="false"
          />
        </span>
        <span>
          <!-- <input type="number" v-model="info.zoom" /> -->
          <Slider
            :min="-5"
            :max="5"
            v-model="info.zoom"
          />
        </span>
        <button
          class=""
          @click="clipboard.cards = clipboard.cards.concat(cards.value)"
        >
          Clip All
        </button>
      </div>

      <div class="menu" />

      <div
        class="clipboard"
        :class="{'show': clipboard.show}"
        @click="clipboard.show = !clipboard.show"
      >
        <h3>Clipboard</h3>
        <div class="clip-cards">
          <div
            class="clip-card"
            v-for="card in clipboard.cards"
            :key="'clip-' + card.name"
          >
            <p>1 {{ card.name }}</p> 
          </div>
        </div>
        <div class="buttons">
          <button @click="clipboard.cards = []">
            Clear
          </button>
          <button @click="exportList('mtgo')">
            MTGO
          </button>
          <button @click="exportList('moxfield')">
            Mox
          </button>
        </div>
      </div>

      <div
        class="cards"
        v-if="!upload.show"
        :style="{ 'font-size': 18 + (info.zoom * 2) + 'px' }"
      >
        <div
          class="card"
          v-for="card in cards['value'].slice(0, 250)"
          :key="card.id"
        >
          <div class="img">
            <img
              v-if="card.image_uris"
              :src="card.image_uris.normal"
            >
            <img
              class="flip front"
              v-if="card.card_faces && card.card_faces[0].image_uris"
              :src="card.card_faces[0].image_uris.normal"
            >
            <img
              class="flip back"
              v-if="card.card_faces && card.card_faces[0].image_uris"
              :src="card.card_faces[1].image_uris.normal"
            >
            <button
              class="small clip"
              @click="clipboard.cards.push(card)"
            >
              +
            </button>
          </div>
          <p class="name">
            {{ card.count }} {{ card.name }}
          </p>
          <p>{{ card.set_name }}</p>
          <p>{{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.price) }}</p>

          <!-- <p>{{ card.frame }}</p> -->
          <!-- <p>{{ card.full_art }}</p> -->
          <!-- <p>{{ card.border_color }}</p> -->
          <!-- <p>{{ card.promo }}</p> -->
          <!-- <p>{{ card.reprint }}</p> -->
          <!-- <p>{{ card.variation }}</p> -->
          <!-- <p>{{ card.prices }}</p> -->
          <!-- <p>{{ card.prices.eur }}</p> -->
          <!-- <p>{{ card.rarity }}</p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
hr {
  margin: 20px 0;
  border-color: var(--colour-dark-grey);
  opacity: 0.4;
  border-width: 1px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
}
.info-bar {
  background-color: var(--colour-sidebar);
  height: 3rem;
  position: sticky;
  width: 100%;
  text-align: center;
  line-height: 3rem;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  top: 0;
  z-index: 2;
}
.info-bar .multiselect,
.info-bar .slider-target {
  min-width: 8em;
}
.clipboard {
  max-height: 100%;
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 3rem;
  bottom: 0;
  right: 0;
  width: 400px;
  transform: translate(calc(100% - 2rem), 0);
  background-color: var(--colour-sidebar);
  transition: all 0.2s;
  padding: 2rem;
  color: transparent;
  z-index: 1;
}
.clipboard.show {
  transform: translate(0, 0);
  color: var(--colour-light-font);
}
.clipboard .clip-cards {
  flex-grow: 1;
  overflow: auto;
}
.clipboard .buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
#window {
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
}
#sidebar {
  min-width: 380px;
  width: 400px;
  text-align: left;
  padding: 40px 20px;
  background-color: var(--colour-sidebar);
  overflow: auto;
  gap: 5px 0;
  display: flex;
  flex-direction: column;
}

#main {
  position: relative;
  flex-grow: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 99;
  line-height: 100vh;
  text-align: center;
  font-size: 2rem;
}
.upload {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 640px;
  margin: auto;
  gap: 20px;
}
.upload .close {
  position: absolute;
  top: 0;
  right: 0;
}
.upload .close span {
  display: block;
  transform: rotate(45deg);
}
.upload .form {
  display: grid;
  grid-template-columns: 1fr 10fr;
  gap: 20px;
  width: 100%;
  align-items: center;
}
/* .upload input[type="file"] {
  display: none;
} */
.upload .file {
  grid-column: span 2;
  display: block;
  width: 100%;
  background-color: var(--colour-input-grey);
  height: 200px;
}
.upload textarea {
  grid-column: 2;
  width: 100%;
  height: 300px;
}
.upload .buttons {
  grid-column: span 2;
  text-align: center;
}
.upload input[type="file"] {
  display: none;
}
.upload label {
  grid-column: 2;
}
.collections {
  display: flex;
  gap: 5px;
}
.progress {
  grid-column: span 2;
  position: relative;
  display: block;
  border-radius: var(--default-br);
  background-color: var(--colour-input-grey);
  height: var(--height-input);
  line-height: var(--height-input);
  text-align: center;
  font-family: "Beleren SmallCaps Bold";
  overflow: hidden;
}

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

.progress .bar {
  position: absolute;
  bottom: 0;
  height: 3px;
  background-color: var(--colour-accent);
  transition: all 0.3s;
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

.compare input[type=checkbox] {
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
.compare input[type=checkbox]:checked ~ label.inc{
  color: var(--colour-green);
}
.compare input[type=checkbox]:checked ~ label.exc{
  color: var(--colour-red);
}
.mana {
  padding: 0 10px;
}
.mana input {
  min-width: 0;
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
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
  gap: 2em;
  padding: 2rem;
  position: absolute;
  top: 3rem;
  left: 0;
  right: 2rem;
  bottom: 0;
  overflow: auto;
}
.card {
  min-width: 15em;
  /* flex-grow: 1; */
}
.card .flip.back {
  display: none;
}
.card .img {
  position: relative;
}
.card .img:hover .flip.front {
  display: none;
}
.card .img:hover .flip.back {
  display: initial;
}
.card .img .clip {
  display: none;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}
.card .img:hover .clip {
  display: block;
}
.card p {
  font-size: .9em;
  text-indent: .5rem;
}
.card .name {
  font-weight: bold;
  display: block;
  font-size: 1em;
  font-family: "Beleren Bold";
  line-height: 1;
  /* font-weight: 600; */
}
.card img {
  width: 100%;
  border-radius: 5%;
  box-shadow: 0px 2px 5px #000000f2;
}
@media (max-width: 640px) {
  #window {
    flex-direction: column;
  }
  #main {
    height: 60%;
    order: 0;
    width: 100%;
  }
  #sidebar {
    height: 40%;
    order: 1;
    width: 100%;
    min-width: 0;
  }
  .cards {
    justify-content: center;
  }
}
</style>
