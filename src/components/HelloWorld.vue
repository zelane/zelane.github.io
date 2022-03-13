<script setup>
import { reactive, ref, watch } from "vue";
import Papa from "papaparse";
import Multiselect from '@vueform/multiselect'
import Dexie from 'dexie';
import Fuse from 'fuse.js'

defineProps({});

const skyfallUrl = "https://api.scryfall.com/cards/collection";
const file = ref(null);
let upload = reactive({ 'active': false, 'progress': 0, 'count': 0, 'total': 0 })
// let upload = reactive({ 'active': true, 'progress': 30, 'count': 12, 'total': 143 })

const db = new Dexie('mtg');
db.version(4).stores({
  cards: '++id, name, prices.eur, type_line, color_identity, keywords, rarity'
});

const colours = { Red: "R", Green: "G", Black: "B", Blue: "U", White: "W", Colourless: "X" };
const rarities = ['mythic', 'rare', 'uncommon', 'common'];
let keywords = new Set();
let filterVals = reactive({ tribes: [], keywords: [] });
let filters = reactive({ colours: [], rarity: [], keywords: [], tribes: [], name: "", cardText: "", set: "" });


let allCards = []
let cards = reactive({ value: [] });
db.cards.toArray().then(async dbCards => {
  allCards = dbCards
  cards['value'] = await filterCards(allCards, filters)
})

let to = null;
watch(filters, async (value) => {
  clearTimeout(to);
  to = setTimeout(async () => {
    cards['value'] = await filterCards(allCards, value)
  }, 500);
})

fetch('https://api.scryfall.com/catalog/creature-types').then(resp => resp.json()).then(data => {
  filterVals.tribes = data['data']
})

db.cards.orderBy('keywords').uniqueKeys((keys) => {
  keys.forEach(kws => {
    kws.forEach(kw => {
      keywords.add(kw)
    })
  })
  filterVals.keywords = [...keywords]
});

async function post(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

const filterCards = async (cards, filters) => {
  // console.log({ ...filters })
  // console.log(filters.rarity)
  return new Promise((resolve, reject) => {
    let filtered = cards
    filtered.sort((a, b) => {
      if (!a.prices.eur) {
        return true
      }
      else {
        return parseFloat(a.prices.eur) < parseFloat(b.prices.eur)
      }
    });

    if (filters.cardText && filters.cardText != "") {
      const fuse = new Fuse(filtered, {
        ignoreLocation: true,
        threshold: 0.5,
        keys: ['oracle_text', 'card_faces.oracle_text'],
      })
      filtered = []
      fuse.search(filters.cardText).forEach(item => {
        filtered.push(item['item'])
      });
    }
    filtered = filtered.filter((card) => {
      const hasName = !filters.name || !filters.name != "" || card.name.toLowerCase().includes(filters.name.toLowerCase())

      const hasColour = filters.colours.every((colour) => {
        if (colour == "X") {
          return card.color_identity.length == 0
        }
        else {
          return (card.color_identity || []).includes(colour);
        }
      });

      const hasKeyword = filters.keywords.every((keyword) => {
        return (card.keywords || []).includes(keyword);
      });

      const hasTribe = filters.tribes.every((tribe) => {
        return (card.type_line.toLowerCase() || "").includes(tribe.toLowerCase());
      });

      const hasRarity = filters.rarity.length > 0 ? [...filters.rarity].includes(card.rarity) : true

      const hasEdition = filters.set ? card.set == filters.set : true

      return hasColour && hasKeyword && hasTribe && hasRarity && hasName && hasEdition
    });
    resolve(filtered.slice(0, 200))
  })
};

const handleFileUpload = async () => {
  const reader = new FileReader();
  upload.active = true;
  upload.progress = 0;
  reader.onload = (e) => {
    Papa.parse(e.target.result, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      complete: async (result) => {
        let seen = new Set();
        let ids = [];
        result.data.forEach((elem) => {
          let code = elem["Set Code"] + elem["Card Number"].toString();
          if (!seen.has(code)) {
            ids.push({
              set: elem["Set Code"],
              collector_number: elem["Card Number"].toString(),
            });
          }
          seen.add(code)
        });
        let cardData = []
        upload.total = ids.length
        for (let i = 0; i < ids.length; i += 75) {
          let resp = await post(skyfallUrl, { 'identifiers': ids.slice(i, i + 75) })
          cardData = cardData.concat(resp["data"]);
          upload.count = i;
          upload.progress = (i / ids.length) * 100;
          await new Promise(r => setTimeout(r, 100));
        }
        upload.progress = 100;
        await db.cards.clear()
        cardData.forEach((card) => {
          db.cards.add(card);
        })
        allCards = cardData;
        cards['value'] = await filterCards(cardData, filters);
        upload.active = false;
      },
    });
  };
  reader.readAsText(file.value.files[0]);
};
</script>

<template>
  <div id="window">
    <div id="sidebar">
      <label for="upload" v-if="!upload.active">Upload CSV</label>
      <input id="upload" ref="file" v-on:change="handleFileUpload()" type="file" />
      <div class="progress" v-if="upload.active">
        <span>Processing cards: {{ upload.count }} / {{ upload.total }}</span>
        <div class="bar" :style="{ width: upload.progress + '%' }"></div>
      </div>
      <br />

      <div class="filter-group">
        <h3>Colours</h3>
        <div class="input-group" v-for="(code, colour) in colours" key="code">
          <input type="checkbox" v-model="filters.colours" :value="code" :id="code" />
          <label :for="code">{{ colour }}</label>
        </div>
      </div>

      <div class="filter-group">
        <h3>Rarity</h3>
        <div class="input-group" v-for="rarity in rarities" key="code">
          <input type="checkbox" v-model="filters.rarity" :value="rarity" :id="rarity" />
          <label :for="rarity">{{ rarity }}</label>
        </div>
      </div>

      <!-- <div class="filter-group">
        <h3>Rarity</h3>
        <div class="input-group" key="rarity">
          <input type="radio" v-model="filters.rarity" value id="any" checked />
          <label for="any">Any</label>
        </div>
        <div class="input-group" v-for="rarity in rarities" key="rarity">
          <input type="radio" v-model="filters.rarity" :value="rarity" :id="rarity" />
          <label :for="rarity">{{ rarity }}</label>
        </div>
      </div>-->

      <div class="filter-group">
        <h3>Name</h3>
        <input type="search" v-model="filters.name" />
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
        <h3>Card text</h3>
        <input type="search" v-model="filters.cardText" />
      </div>

      <div class="filter-group">
        <h3>Set</h3>
        <input type="search" v-model="filters.set" />
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
          <p>{{ card.set_name }} [{{ card.set }}]</p>
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
  /* line-height: 1em; */
  /* min-height: 3em; */
}
.card img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0px 2px 5px #000000f2;
}
</style>
