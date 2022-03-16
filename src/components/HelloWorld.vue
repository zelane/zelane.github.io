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
db.version(1).stores({
  collections: '&name',
});

const colours = {
  Red: 'R', Green: 'G', Black: 'B', Blue: 'U', White: 'W', Colourless: 'C',
};
const rarities = ['mythic', 'rare', 'uncommon', 'common'];
const filterVals = reactive({ tribes: [], keywords: [], sets: [] });
const filters = reactive({
  colours: [], rarity: [], keywords: [], tribes: [], name: '', cardText: '', sets: [], mana: [0, 20],
});

const filterCards = async (cards, _filters) => new Promise((resolve) => {
  let filtered = cards;
  filtered.sort((a, b) => {
    if (!a.prices.eur) {
      return true;
    }

    return parseFloat(a.prices.eur) < parseFloat(b.prices.eur);
  });

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
  filtered = filtered.filter((card) => {
    const hasName = !_filters.name || !_filters.name != '' || card.name.toLowerCase().includes(_filters.name.toLowerCase());
    if (!hasName) return false;

    const hasColour = _filters.colours.every((colour) => {
      if (colour === 'C') {
        return card.color_identity.length === 0;
      }
      return (card.color_identity || []).includes(colour);
    });
    if (!hasColour) return false;

    const hasKeyword = _filters.keywords.every((keyword) => (card.keywords || []).includes(keyword));
    if (!hasKeyword) return false;

    const hasTribe = _filters.tribes.every((tribe) => (card.type_line.toLowerCase() || '').includes(tribe.toLowerCase()));
    if (!hasTribe) return false;

    const hasRarity = _filters.rarity.length > 0 ? [..._filters.rarity].includes(card.rarity) : true;
    if (!hasRarity) return false;

    let hasSet = true;
    if (_filters.sets.length > 0) {
      hasSet = _filters.sets.some((set) => card.set === set);
    }
    if (!hasSet) return false;

    const hasMana = card.cmc >= _filters.mana[0] && card.cmc <= _filters.mana[1];
    if (!hasMana) return false;

    return true;
  });
  resolve(filtered.slice(0, 200));
});
let allCards = [];
const cards = reactive({ collections: [], value: [] });
let activeCollection = reactive({ value: "" });


const loadCollection = async (name) => {
  if (name === "") {
    return;
  }
  let collection = await db.collections.get({ name: name });
  allCards = collection.cards;
  cards.value = await filterCards(allCards, filters);
  const keywords = new Set();
  const sets = [];
  allCards.forEach((card) => {
    card.keywords.forEach((kw) => {
      keywords.add(kw);
    });
    sets[card.set] = card.set_name;
  });
  filterVals.keywords = [...keywords];
  filterVals.sets = Object.keys(sets).map((key) => ({ set: key, setName: sets[key] }));
};

const deleteCollection = async (name) => {
  await db.collections.delete(name);
  cards.collections.pop(name);
  activeCollection.value = cards.collections.length > 0 ? cards.collections[0] : "";
};

watch(activeCollection, x => loadCollection(x.value));

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
  cards.collections = keys;
  activeCollection.value = keys[0];
});

caches.open('cardDataCache').then(async (cache) => {
  const typeRequest = new Request('https://api.scryfall.com/catalog/creature-types');
  let response = await cache.match(typeRequest);
  if (!response) {
    await cache.add(typeRequest);
    response = await cache.match(typeRequest);
  }
  const json = await response.json();
  filterVals.tribes = json.data;
});

async function post(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

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
      console.log(m);
      cards[m[3] + m[4]] = {
        name: m[2],
        count: m[1],
        set: m[3],
        number: m[4],
      };
    };
    // console.log(matches);
  }
  else if (upload.format === 'MTGO') {
    const re = /([0-9]+) (.+)/g;
    const matches = upload.text.matchAll(re);
    for (const m of matches) {
      console.log(m);
      cards[m[2]] = {
        name: m[2],
        count: m[1],
        set: '',
        number: '',
      };
    }
  }
  fetchCardData(cards);
};

const fileElem = ref(null);

const onFileChange = e => {
  e.preventDefault();
  console.log(e.dataTransfer.items[0].getAsFile());
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
    fetchCardData(cardList);
  };
  let encoding = await checkEncoding(file);
  console.log(encoding);
  reader.readAsText(file, encoding);
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
    cards[row['Set Code'] + row['Card Number']] = {
      name: row['Card Name'],
      count: 0,
      set: row['Set Code'],
      number: row['Card Number'].toString(),
    };
  });
  return cards;
};

const fetchCardData = async (cardList) => {
  const ids = [];

  try {
    Object.keys(cardList).forEach(key => {
      let _card = cardList[key];
      let elem = {};
      if (_card.set === '' && _card.number === '') {
        elem.name = _card.name;
      }
      if (_card.set !== '') {
        elem.set = _card.set;
      }
      if (_card.number !== '') {
        elem.collector_number = _card.number;
      }
      ids.push(elem);
    });
    let cardData = [];
    upload.total = ids.length;
    for (let i = 0; i < ids.length; i += 75) {
      const resp = await post(skyfallUrl, { identifiers: ids.slice(i, i + 75) });
      cardData = cardData.concat(resp.data);
      upload.count = i;
      upload.progress = (i / ids.length) * 100;
      await new Promise((r) => setTimeout(r, 100));
    }
    upload.progress = 100;
    let name = upload.name;
    db.collections.put({ 'name': name, 'cards': cardData });
    if (!cards.collections.includes(name)) {
      cards.collections.push(name);
    }
    activeCollection.value = name;
  }
  catch {

  }
  finally {
    upload.active = false;
    upload.count = 0;
    upload.progress = 0;
    upload.total = 0;
    upload.show = false;
  }
};

</script>

<template>
  <div id="window">
    <div id="sidebar">
      <h3>Collection</h3>
      <div class="filter-group collections">
        <Multiselect
          v-model="activeCollection.value"
          :options="cards.collections"
          mode="single"
          :canClear="false"
        />
        <button class="small add" @click="upload.show = true">+</button>
        <button class="small remove" @click="deleteCollection(activeCollection.value)">-</button>
      </div>

      <h3>Colours</h3>
      <div class="filter-group colours">
        <div
          class="input-group colour"
          :class="filters.colours.includes(code) ? 'selected' : ''"
          :data-colour="code"
          v-for="code in colours"
          :key="code"
        >
          <input type="checkbox" v-model="filters.colours" :value="code" :id="code" />
          <label :for="code" :class="'icon icon-' + code"></label>
        </div>
      </div>

      <h3>Rarity</h3>
      <div class="filter-group rarities">
        <div
          class="input-group rarity"
          :data-rarity="rarity"
          v-for="rarity in rarities"
          :key="rarity"
        >
          <input type="checkbox" v-model="filters.rarity" :value="rarity" :id="rarity" />
          <label :for="rarity" class="icon icon-logo"></label>
        </div>
      </div>

      <h3>Name</h3>
      <div class="filter-group">
        <input type="search" v-model="filters.name" />
      </div>

      <h3>Mana Cost</h3>
      <div class="filter-group mana">
        <Slider v-model="filters.mana" :min="0" :max="20" />
      </div>

      <h3>Keywords</h3>
      <div class="filter-group">
        <Multiselect
          v-model="filters.keywords"
          :options="filterVals.keywords"
          :searchable="true"
          mode="tags"
        />
      </div>

      <h3>Types</h3>
      <div class="filter-group">
        <Multiselect
          v-model="filters.tribes"
          :options="filterVals.tribes"
          :searchable="true"
          mode="tags"
          :create-option="true"
        />
      </div>

      <h3>Card text</h3>
      <div class="filter-group">
        <input type="search" v-model="filters.cardText" />
      </div>

      <h3>Set</h3>
      <div class="filter-group">
        <Multiselect
          v-model="filters.sets"
          :options="filterVals.sets"
          label="setName"
          valueProp="set"
          :searchable="true"
          mode="tags"
        />
      </div>
    </div>

    <div id="main">
      <div class="upload" v-if="upload.show">
        <button class="small close" @click="upload.show = false">
          <span>+</span>
        </button>
        <div class="form">
          <h3>Name</h3>
          <input type="text" v-model="upload.name" />
          <h3>Format</h3>
          <Multiselect
            v-model="upload.format"
            :options="['DragonShield Web', 'DragonShield Mobile', 'MTGA', 'MTGO']"
            :canClear="false"
          />
          <!-- <h3>Encoding</h3>
        <Multiselect
          v-model="upload.encoding"
          :options="['UTF-16LE', 'UTF-16BE', 'UTF-8', 'ascii']"
          />-->
          <template v-if="['MTGA', 'MTGO'].includes(upload.format)">
            <textarea v-model="upload.text"></textarea>
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
          />
          <div class="buttons" v-if="!upload.active && upload.format && (upload.text || fileElem)">
            <button
              @click="['MTGA', 'MTGO'].includes(upload.format) ? handleTextUpload() : handleFileUpload()"
            >Upload</button>
          </div>

          <div class="progress" v-if="upload.active">
            <span>Processing cards: {{ upload.count }} / {{ upload.total }}</span>
            <div class="bar" :style="{ width: upload.progress + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="cards" v-if="!upload.show">
        <div class="card" v-for="card in cards['value']" :key="card.id + card.foil">
          <img v-if="card.image_uris" :src="card.image_uris.normal" />
          <img
            class="flip front"
            v-if="card.card_faces && card.card_faces[0].image_uris"
            :src="card.card_faces[0].image_uris.normal"
          />
          <img
            class="flip back"
            v-if="card.card_faces && card.card_faces[0].image_uris"
            :src="card.card_faces[1].image_uris.normal"
          />
          <p class="name">{{ card.name }}</p>
          <p>{{ card.set_name }}</p>
          <p>{{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.prices.eur) }}</p>

          <!-- <p>{{ card.prices.eur }}</p> -->
          <!-- <p>{{ card.rarity }}</p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  width: 400px;
  text-align: left;
  padding: 50px 20px;
  background-color: #111;
  padding-top: 60px;
  overflow: auto;
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
  background-color: #333;
  height: 200px;
}
.upload textarea {
  grid-column: 2;
  width: 100%;
  height: 300px;
  background-color: #333;
  border: none;
  border-radius: 4px;
  color: #efefef;
  font-family: "Spectral", Helvetica, Arial, sans-serif;
  padding: 20px;
  box-sizing: border-box;
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
  gap: 10px;
}
.progress {
  grid-column: span 2;
  position: relative;
  display: block;
  border-radius: 4px;
  background-color: #222;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-family: "Beleren SmallCaps Bold";
  overflow: hidden;
}

.progress .bar {
  position: absolute;
  bottom: 0;
  height: 3px;
  background-color: #621895;
  transition: all 0.3s;
  /* background: linear-gradient(
    90deg,
    rgba(255, 123, 123, 1) 0%,
    rgba(255, 123, 123, 1) 20%,
    rgba(125, 228, 159, 1) 20%,
    rgba(125, 228, 159, 1) 40%,
    rgba(204, 195, 192, 1) 40%,
    rgba(204, 195, 192, 1) 60%,
    rgba(171, 225, 250, 1) 60%,
    rgba(171, 225, 250, 1) 80%,
    rgba(255, 247, 177, 1) 80%,
    rgba(255, 247, 177, 1) 100%
  ); */
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
  gap: 10px;
}
.colours input[type="checkbox"]:checked + label,
.rarities input[type="checkbox"]:checked + label {
  opacity: 1;
}
.colours input[type="checkbox"],
.rarities input[type="checkbox"] {
  display: none;
}
.colour label,
.rarity label {
  display: block;
  width: 40px;
  opacity: 0.5;
  transition: all 0.1s;
  cursor: pointer;
}

.rarity label {
  font-size: 40px;
  text-align: center;
  text-shadow: 0px 0px 1px black;
}
.colour label {
  color: #111;
  background-color: #666;
  height: 40px;
  width: 40px;
  line-height: 40px;
  border-radius: 50%;
  font-size: 35px;
  text-align: center;
  box-shadow: 2px 2px 0px black;
}
.colour.selected label {
  color: #01121c;
}
.colour[data-colour="R"].selected label {
  background-color: #f9ac90;
  background-color: #ff7b7b;
}
.colour[data-colour="G"].selected label {
  background-color: #9cd4af;
  background-color: #7de49f;
}
.colour[data-colour="B"].selected label {
  background-color: #ccc3c0;
}
.colour[data-colour="U"].selected label {
  background-color: #abe1fa;
  background-color: #75d3ff;
}
.colour[data-colour="W"].selected label {
  background-color: #fffbd6;
  background-color: #fff7b1;
}
.colour[data-colour="C"].selected label {
  background-color: #cdc3c1;
}

.rarity[data-rarity="mythic"] label {
  color: #bf4427;
  color: #de822b;
  /* color: #222;
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
  color: #dbc98e;
}
.rarity[data-rarity="uncommon"] label {
  color: #707883;
  color: #7a939d;
}
.rarity[data-rarity="common"] label {
  color: #efefef;
}

#main {
  flex-grow: 1;
  width: 100%;
  overflow: auto;
  padding: 50px 20px;
}
.cards {
  display: flex;
  justify-content: flex-start;
  align-items: bottom;
  flex-wrap: wrap;
  gap: 20px;
}
.card {
  width: 250px;
}
.card .flip.back {
  display: none;
}
.card:hover .flip.front {
  display: none;
}
.card:hover .flip.back {
  display: initial;
}
.card .name {
  font-weight: bold;
  display: block;
  font-size: 1.1em;
  font-family: "Beleren Bold";
  line-height: 1;
  /* font-weight: 600; */
}
.card img {
  width: 100%;
  border-radius: 12px;
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
  }
  .cards {
    justify-content: center;
  }
}
</style>
