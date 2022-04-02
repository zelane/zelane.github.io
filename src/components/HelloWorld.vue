<script setup>
import { reactive, ref, watch } from 'vue';
import Papa from 'papaparse';
import Multiselect from '@vueform/multiselect';
import Slider from '@vueform/slider';
import Dexie from 'dexie';
import Filters from './Filters.vue';

const skyfallUrl = 'https://api.scryfall.com/cards/collection';
const upload = reactive({
  show: false, name: null, file: null, text: null, encoding: null, format: null, active: false, progress: 0, count: 0, total: 0
});
// let upload = reactive({ show: false, name: null, file: null, text: null, encoding: null, format: null, active: true, progress: 50, count: 50, total: 100 })

const db = new Dexie('mtg');
db.version(2).stores({
  collections: '&name'
});
const filterVals = reactive({ allSets: [] });
const info = reactive({ count: 0, total_value: 0, zoom: 0 });
const clipboard = reactive({show: false, cards: []});
const setIds = new Set();
let loading = ref(false);

const cards = reactive({ collections: [], all: [], filtered: [], sort: 'Price' });
let activeCollections = reactive({ value: [] });

const loadCollections = async (names) => {
  if (names === []) {
    return;
  }
  let cardMap = new Map();
  for(const name of names) {
    let collection = await db.collections.get({ name: name });
    for(const card of collection.cards) {
      if(cardMap.has(card.id)) {
        let ex = cardMap.get(card.id);
        ex.count = parseInt(ex.count) + parseInt(card.count);
        cardMap.set(card.id, ex);
      }
      else {
        cardMap.set(card.id, card);
      }
    }
  }
  cards.all = [...cardMap.values()];
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
    cards.all = cards;
  }
  finally {
    loading.value = false;
  }
};

const deleteCollection = async (name) => {
  await db.collections.delete(name);
  cards.collections.pop(name);
  activeCollections.value = [];
};

watch(activeCollections, x => loadCollections(x.value));

const filtersChanged = async (filteredCards, count, value) => {
  info.count = count;
  info.total_value = value;
  cards.filtered = filteredCards;
  loading.value = false;
};

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
        name: m[2].split(' // ')[0],
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
        name: m[2].split(' // ')[0],
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
  console.log(cardList);

  // If collection exists and append, only add new cards, sum counts
  if(append && cards.collections.includes(upload.name)) {
    const collection = await db.collections.get({ name: upload.name });
    cardData = collection.cards;
    for(const [key, card] of Object.entries(cardList)) {
      let existing = collection.cards.filter(c => {
        if(card.set !== '' && card.set === c.set && card.number === c.collector_number) return true;
        return c.name === card.name;
      });
      if(existing.length > 0) {
        console.log("Found", existing);
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
    clipboard.cards.forEach(card => {
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
          :searchable="true"
        />
        <button
          class="small add"
          @click="upload.show = true"
        >
          +
        </button>
        <button
          class="small remove"
          @click="deleteCollection(activeCollections.value[0])"
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
          @loading="loading.value = true"
        />
      </div>

      <hr>
      
      <Filters
        @change="filtersChanged"
        :cards="cards.all"
        :collections="cards.collections"
        :db="db"
        :sort="cards.sort"
      />

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

          <template v-if="['MTGA', 'MTGO'].includes(upload.format)">
            <textarea v-model="upload.text" />
          </template>

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
            v-model="cards.sort"
            :options="['Mana', 'Price', 'Count']"
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
          v-for="card in cards.filtered.slice(0, 250)"
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

.progress .bar {
  position: absolute;
  bottom: 0;
  height: 3px;
  background-color: var(--colour-accent);
  transition: all 0.3s;
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
