<script setup>
import { reactive, ref, watch } from "vue";
import Papa from "papaparse";
import Multiselect from '@vueform/multiselect'

defineProps({});

const skyfallUrl = "https://api.scryfall.com/cards/collection";
const file = ref(null);

const colours = { Red: "R", Green: "G", Black: "B", Blue: "U", White: "W", Colourless: "X" };
const rarities = ['mythic', 'rare', 'uncommon', 'common'];
let keywords = new Set();
let filterVals = reactive({ tribes: [] });

fetch('https://api.scryfall.com/catalog/creature-types').then(resp => resp.json()).then(data => {
  filterVals.tribes = data['data']
})

let filters = reactive({ colours: [], rarity: [], keywords: [], tribes: [] });

watch(filters, (value) => {
  applyFilters()
})

let allCards = [];
if (localStorage.getItem("cards")) {
  try {
    allCards = JSON.parse(localStorage.getItem("cards"));
  } catch (e) {
    console.error(e);
  }
}

let cards = reactive({ value: allCards });

allCards.forEach((card) => {
  // console.log(card)
  card.keywords.forEach((kw) => {
    keywords.add(kw)
  })
})
allCards.sort((a, b) => parseFloat(a.prices.eur) < parseFloat(b.prices.eur));

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

const applyFilters = () => {
  console.log({ ...filters })
  console.log({ ...filters.tribes })
  cards["value"] = allCards.filter((card) => {

    const hasColour = filters["colours"].every((colour) => {
      if (colour == "X") {
        return card.color_identity.length == 0
      }
      else {
        return (card.color_identity || []).includes(colour);
      }
    });

    const hasKeyword = filters["keywords"].every((keyword) => {
      return (card.keywords || []).includes(keyword);
    });

    const hasTribe = filters["tribes"].every((tribe) => {
      return (card.type_line.toLowerCase() || "").includes(tribe.toLowerCase());
    });
    const hasRarity = filters["rarity"].every((rarity) => {
      return card.rarity == rarity
    });

    return hasColour && hasKeyword && hasTribe && hasRarity
  });
};

const handleFileUpload = async () => {
  const reader = new FileReader();
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
        allCards = []
        for (let i = 0; i < ids.length; i += 75) {
          console.log(i, ids.length)
          let resp = await post(skyfallUrl, { 'identifiers': ids.slice(i, i + 75) })
          allCards = allCards.concat(resp["data"]);
        }
        localStorage.setItem("cards", JSON.stringify(allCards));
        cards["value"] = allCards;
        await new Promise(r => setTimeout(r, 100));
      },
    });
  };
  reader.readAsText(file.value.files[0]);
};
</script>

<template>
  <div id="window">
    <div id="sidebar">
      <input ref="file" v-on:change="handleFileUpload()" type="file" />
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
        <div class="input-group" v-for="rarity in rarities" key="rarity">
          <input type="checkbox" v-model="filters.rarity" :value="rarity" :id="rarity" />
          <label :for="rarity">{{ rarity }}</label>
        </div>
      </div>

      <!-- <div class="filter-group">
        <h3>Keywords</h3>
        <div class="input-group" v-for="keyword in keywords" key="keyword">
          <input type="checkbox" v-model="filters.keywords" :value="keyword" :id="keyword" />
          <label :for="keyword">{{ keyword }}</label>
        </div>
      </div>-->

      <div class="filter-group">
        <h3>Keywords</h3>
        <Multiselect
          v-model="filters.keywords"
          :options="[...keywords]"
          :searchable="true"
          mode="tags"
        />
      </div>

      <div class="filter-group">
        <h3>Tribes</h3>
        <Multiselect
          v-model="filters.tribes"
          :options="filterVals.tribes"
          :searchable="true"
          mode="tags"
          :create-option="true"
        />
      </div>
    </div>

    <div id="main">
      <div class="cards">
        <div class="card" v-for="card in cards['value']" :key="card.id + card.foil">
          <img v-if="card.image_uris" :src="card.image_uris.normal" />
          <img
            v-if="card.card_faces && card.card_faces[0].image_uris"
            :src="card.card_faces[0].image_uris.normal"
          />
          <p class="name">{{ card.name }}</p>
          <p>{{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.prices.eur) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
a {
  color: #42b983;
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
#main {
  flex-grow: 1;
  width: 100%;
  overflow: auto;
  padding: 50px 20px;
}
.cards {
  display: flex;
  justify-content: center;
  align-items: bottom;
  flex-wrap: wrap;
  gap: 20px;
}
.card {
  width: 250px;
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
}
</style>
