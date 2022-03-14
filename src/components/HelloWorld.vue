<script setup>
import { reactive, ref, watch } from 'vue';
import Papa from 'papaparse';
import Multiselect from '@vueform/multiselect';
import Dexie from 'dexie';
import Fuse from 'fuse.js';

// defineProps({});

const skyfallUrl = 'https://api.scryfall.com/cards/collection';
const upload = reactive({
  active: false, progress: 0, count: 0, total: 0,
});
// let upload = reactive({ 'active': true, 'progress': 30, 'count': 12, 'total': 143 })

const db = new Dexie('mtg');
db.version(4).stores({
  cards: '++id, name, prices.eur, type_line, color_identity, keywords, rarity',
});

const colours = {
  Red: 'R', Green: 'G', Black: 'B', Blue: 'U', White: 'W', Colourless: 'C',
};
const rarities = ['mythic', 'rare', 'uncommon', 'common'];
const filterVals = reactive({ tribes: [], keywords: [], sets: [] });
const filters = reactive({
  colours: [], rarity: [], keywords: [], tribes: [], name: '', cardText: '', sets: [], mana: { min: 0, max: 20 },
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
    const hasName = !_filters.name || !_filters.name !== '' || card.name.toLowerCase().includes(_filters.name.toLowerCase());
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

    const hasMana = card.cmc >= (_filters.mana.min || 0) && card.cmc <= (_filters.mana.max !== "" ? _filters.mana.max : 20);
    if (!hasMana) return false;

    return true;
  });
  resolve(filtered.slice(0, 200));
});
let allCards = [];
const cards = reactive({ value: [] });

const updateCards = async (_cards) => {
  allCards = _cards;
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

db.cards.toArray().then((_cards) => updateCards(_cards));

let to = null;
watch(filters, async (value) => {
  clearTimeout(to);
  to = setTimeout(async () => {
    cards.value = await filterCards(allCards, value);
  }, 500);
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

// db.cards.orderBy('keywords').uniqueKeys((keys) => {
//   let keywords = new Set();
//   keys.forEach(kws => {
//     kws.forEach(kw => {
//       keywords.add(kw)
//     })
//   })
//   filterVals.keywords = [...keywords]
// });
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

const handleFileUpload = async (e) => {
  let file = e.target.files[0];
  const reader = new FileReader();
  upload.active = true;
  upload.progress = 0;
  reader.onload = (e) => {
    const csv = reader.result.replace('"sep=,"', '');
    Papa.parse(csv, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: fetchCardData,
    });
  };
  let encoding = await checkEncoding(file);
  console.log(encoding);
  reader.readAsText(file, encoding);
};

const fetchCardData = async (cardsCsv) => {
  const seen = new Set();
  const ids = [];
  cardsCsv.data.forEach((elem) => {
    const code = elem['Set Code'] + elem['Card Number'].toString();
    if (!seen.has(code)) {
      ids.push({
        set: elem['Set Code'],
        collector_number: elem['Card Number'].toString(),
      });
    }
    seen.add(code);
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
  await db.cards.clear();
  db.cards.bulkAdd(cardData);
  updateCards(cardData);
  upload.active = false;
  upload.progress = 0;
  upload.total = 0;
};

</script>

<template>
  <div id="window">
    <div id="sidebar">
      <label for="upload" v-if="!upload.active">Upload CSV</label>
      <input id="upload" ref="file" v-on:change="handleFileUpload" type="file" />
      <div class="progress" v-if="upload.active">
        <span>Processing cards: {{ upload.count }} / {{ upload.total }}</span>
        <div class="bar" :style="{ width: upload.progress + '%' }"></div>
      </div>
      <br />

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
        <!-- <label for="mana-min">Min</label> -->
        <input id="mana-min" type="number" v-model="filters.mana.min" />

        <!-- <label for="mana-max">Max</label> -->
        <input id="mana-max" type="number" v-model="filters.mana.max" />
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

      <!-- <h3>Set</h3>
      <div class="filter-group">
        <input type="search" v-model="filters.set" />
      </div>-->

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
      <div class="cards">
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
a {
  color: #42b983;
}
h3 {
  font-family: "Beleren SmallCaps Bold";
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
  width: 400px;
  text-align: left;
  padding: 50px 20px;
  background-color: #111;
  padding-top: 60px;
  overflow: auto;
}
#upload {
  display: none;
}
label[for="upload"],
.progress {
  position: relative;
  display: block;
  background-color: #222;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-family: "Beleren SmallCaps Bold";
  box-shadow: 0px 2px 1px #000;
  cursor: pointer;
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
  display: flex;
  gap: 20px;
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
}
.card img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0px 2px 5px #000000f2;
}
</style>
