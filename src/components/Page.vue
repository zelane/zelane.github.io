<script setup>
import { reactive, ref, watch, unref } from 'vue';
import Multiselect from '@vueform/multiselect';
import Dexie from 'dexie';
import Filters from './Filters.vue';
import CardParser from './CardParser.vue';
import { deepUnref } from 'vue-deepunref';
import CardList from './CardList.vue';

const db = new Dexie('mtg');
db.version(2).stores({
  collections: '&name'
});
const filterVals = reactive({ allSets: [] });
const info = reactive({ count: 0, total_value: 0, zoom: 0 });
const clipboard = reactive({cards: []});
const ui = reactive({upload: false, clipboard: false, prints: false, sidebarShow: false, sidebar:"clipboard", menu: false, random: {}, selector: 'collection'});
const setIds = new Map();
let loading = ref(false);
let setLoading = ref(false);

const cards = reactive({ collections: [], all: [], filtered: [], sort: 'Price', prints: [] });
let activeCollections = reactive({ value: [] });

const cachedGet = async (cache, url) => {
  // url = encodeURI(url);
  const request = new Request(url);
  let response = await cache.match(request);
  if (!response) {
    await cache.add(request);
    response = await cache.match(request);
  }
  const json = await response.json();
  return json;
};

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
    q: `${query} -border:silver -is:digital`,
    unique: unique
  });
  let _cards = [];
  loading.value = true;
  try {
    while (true) {
      let json = await cachedGet(getCache, url);
      _cards = _cards.concat(json.data);
      if (!json.has_more) break;
      url = json.next_page;
      await new Promise((r) => setTimeout(r, 100));
    }
    cards.all = _cards;
  }
  finally {
    loading.value = false;
  }
};

const loadPrints = async (cardName, unique='prints') => {
  let url = 'https://api.scryfall.com/cards/search?' + new URLSearchParams({
    q: `!"${cardName}" -border:silver -is:digital`,
    unique: unique
  });
  let _cards = [];
  ui.sidebar = 'prints';
  ui.sidebarShow = true;
  setLoading.value = true;
  try {
    while (true) {
      let json = await cachedGet(getCache, url);
      _cards = _cards.concat(json.data);
      if (!json.has_more) break;
      url = json.next_page;
      await new Promise((r) => setTimeout(r, 100));
    }
    _cards.forEach(card => {
      card.price = parseFloat(card.prices.eur || parseFloat(card.prices.usd) * 0.9 || 0);
    });
    cards.prints = _cards.sort((a,b) => a.price < b.price ? 1 : -1);
  }
  finally {
    setLoading.value = false;
  }
};

const deleteCollections = async (names) => {
  if(confirm(`Are you sure you want to delete ${names.join(', ')}?`)) {
    names.map(async name => {
      await db.collections.delete(name);
      cards.collections.pop(name);
      activeCollections.value.pop(name);
    });
  }
  else {
    return;
  }
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

let getCache = null;
caches.open('cardDataCache').then(async (cache) => {
  getCache = cache;
  let as = await cachedGet(cache, 'https://api.scryfall.com/sets');
  as.data.forEach(set => setIds.set(set.name, set.code));
  filterVals.allSets = as.data;
});

const updateCollection = async (name, cardData) => {
  await db.collections.put({ 'name': name, 'cards': cardData });
  if (!cards.collections.includes(name)) {
    cards.collections.push(name);
  }
  activeCollections.value = [name];
};

const exportList = async (format) => {
  let list = "";
  if(format === 'mtgo') {
    clipboard.cards.forEach(card => {
      list += `${card.count || 1} ${card.name} \n`;
    });
  }
  else if(format === 'mkm') {
    clipboard.cards.forEach(card => {
      list += `${card.count || 1} ${card.name} (${card.set_name})\n`;
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

const addToSet = async (set, newCards) => {
  let collection = await db.collections.get({ name: set });
  for(const newCard of newCards) {
    let existing = collection.cards.filter(card => card.id === newCard.id);
    if(existing.length === 0) {
      collection.cards.push({... deepUnref(newCard)});
    }
    else {
      existing[0].count += newCard.count;
    }
  }
  await db.collections.put(collection);
  if(activeCollections.value.includes(set)) {
    cards.all = cards.all.concat(newCard);
  }
};

const groupBySet = (cards) => {
  const grouped = cards.reduce((map,card) => {
    const current = map.get(card.set_name);
    map.set(card.set_name, current ? current + 1 : 1);
    return map;
  }, new Map());
  return new Map([...grouped.entries()].sort((a, b) => a[1] > b[1] ? -1 : 1));
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
          @click="ui.upload = true"
        >
          +
        </button>
        <button
          class="small remove"
          @click="deleteCollections(activeCollections.value)"
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

      <hr>
      
      <Filters
        @change="filtersChanged"
        :cards="cards.all"
        :collections="cards.collections"
        :db="db"
        :sort="cards.sort"
      />
    </div>

    <div
      id="main"
      @click="ui.sidebarShow = false"
    >
      <CardParser
        v-if="ui.upload"
        @change="updateCollection"
        @close="ui.upload=false"
        :db="db"
        :collections="cards.collections"
        :set-ids="new Set(setIds.values())"
      />

      <div class="info-bar">
        <span>Count: {{ info.count }}</span>
        <span>Value: {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(info.total_value) }}</span>
        
        <span
          class="clip"
          @click.stop="() => {ui.sidebar = 'clipboard'; ui.sidebarShow = !ui.sidebarShow}"
        >
          <span class="icon icon-content_paste" />
          <span>{{ clipboard.cards.length }}</span>
        </span>

        <span class="info">
          <a
            href="#"
            @click.stop="{ui.sidebar = 'info'; ui.sidebarShow = !ui.sidebarShow}"
          >Sets</a>
        </span>


        <span class="sort">
          <Multiselect
            v-model="cards.sort"
            :options="['Mana', 'Price', 'Count']"
            mode="single"
            :can-clear="false"
          />
        </span>
        <span class="zoom">
          <input
            type="number"
            v-model="info.zoom"
          >
        </span>
        <!-- <span>
          <Slider
            :min="-5"
            :max="5"
            v-model="info.zoom"
          />
        </span> -->
      </div>


      <div
        class="sidepanel"
        :class="{'show': ui.sidebarShow}"
      >
        <div
          class="menu"
          @click.stop="ui.sidebarShow = !ui.sidebarShow"
        >
          <span class="icon icon-content_paste" />
          <span>{{ clipboard.cards.length }}</span>
        </div>

        <div
          class="prints"
          v-show="ui.sidebar === 'prints'"
        >
          <h3>Prints</h3>
          <CardList
            :cards="cards.prints"
            :loading="setLoading"
            :zoom="1"
            @clip="card => clipboard.cards.push(card)"
          />
        </div>

        <div
          class="info"
          v-if="ui.sidebar === 'info'"
        >
          <h3>Selection info</h3>
          <div class="sets">
            <div
              v-for="[set, count] in groupBySet(cards.filtered).entries()"
              :key="set"
            >
              {{ count }} <a
                href="#"
                @click="setIds.get(set)"
              >{{ set }} {{ setIds.get(set) }}</a>
            </div>
          </div>
        </div>
        
        <div
          class="clipboard"
          v-show="ui.sidebar === 'clipboard'"
        >
          <h3>Clipboard {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(clipboard.cards.reduce((sum, a) => sum += a.price, 0)) }}</h3>
          <div class="clip-cards">
            <div
              class="clip-card"
              v-for="card in clipboard.cards"
              :key="'clip-' + card.name"
            >
              <p>{{ card.count }}x {{ card.name }} ({{ card.set }})</p> 
            </div>
          </div>
          <div class="buttons">
            <div
              class="menu-button"
            >
              <button 
                @click="ui.random.clipExports = !ui.random.clipExports"
              >
                Export
              </button>
              <div
                class="v-menu"
                :class="{show: ui.random.clipExports}"
              >
                <button @click="exportList('mtgo')">
                  MTGO
                </button>
                <button @click="exportList('mkm')">
                  MKM + Set
                </button>
                <button @click="exportList('moxfield')">
                  Mox
                </button>
              </div>
            </div>
            
            <div
              class="menu-button"
            >
              <button 
                @click="ui.random.addToSet = !ui.random.addToSet"
              >
                Add to set
              </button>
              <div
                class="v-menu"
                :class="{show: ui.random.addToSet}"
              >
                <button
                  v-for="col in activeCollections.value"
                  @click="addToSet(col, clipboard.cards)"
                  :key="col"
                >
                  {{ col }}
                </button>
              </div>
            </div>
            <button @click="clipboard.cards = clipboard.cards.concat(cards.filtered)">
              Clip All
            </button>
            <button @click="clipboard.cards = []">
              Clear
            </button>
          </div>
        </div>
      </div>
      <CardList
        :cards="cards.filtered"
        :zoom="info.zoom"
        :loading="loading"
        @clip="card => clipboard.cards.push(card)"
        @view-prints="cardName => loadPrints(cardName)"
        v-if="ui.upload === false"
      />
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
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  top: 0;
  z-index: 2;
}
.info-bar .zoom input {
  max-width: 4rem;
}
.info-bar .multiselect,
.info-bar .slider-target {
  min-width: 6em;
}
select {
  background-color: var(--colour-input-grey);
  color: var(--colour-light-font);
  height: 2.5rem;
  border: none;
  box-shadow: var(--default-shaodw);
  padding: 0 .5rem;
  padding-right: 0;
  font-family: var(--default-fonts);
  font-size: 1rem;;
  /* appearance: none; */
}
option {
  font-family: var(--default-fonts);
  line-height: 2rem;
}
.info-bar .clip {
  display: flex;
  align-items: center;
  gap: .5rem;
  cursor: pointer;
}
.menu {
  /* display: none; */
  position: absolute !important;
  left: 0;
  bottom: 50px;
  z-index: 2;
  cursor: pointer;
  user-select: none;
  background-color: var(--colour-input-grey);
  box-shadow: var(--default-shadow);
  padding: 1rem 1rem;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  transform: translate(-100%, 0);
  left: 0px;
}
.menu span {
  vertical-align: middle;
}
.menu .icon {
  margin-right: .5rem;
  font-size: 1.2em;
}
.menu-button {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  height: var(--height-input);
  gap: 10px;
}
.menu-button button {
  z-index: 2;
}
.menu-button .v-menu {
  display: flex;
  flex-direction: column-reverse;
  opacity: 0;
  pointer-events: none;
  transition: all 0.1s ease-in-out;
  transform: translate(0, 3rem);
  z-index: 1;
  gap: 10px;
  background-color: var(--colour-sidebar);
}
.menu-button .v-menu.show {
  opacity: 1;
  pointer-events: all;
  transform: translate(0, 0);
}

.sidepanel {
  max-height: 100%;
  position: absolute;
  top: 3rem;
  bottom: 0;
  right: 0;
  width: 400px;
  transform: translate(100%, 0);
  background-color: var(--colour-sidebar);
  transition: all 0.2s;
  padding: 1rem 2rem;
  z-index: 2;
  color: var(--colour-light-font);
}
.sidepanel.show {
  transform: translate(0, 0);
}
.sidepanel .info {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sidepanel .info .sets {
  overflow: auto;
  line-height: 1.5;
  flex-grow: 1;
}
.clipboard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.clipboard .clip-cards {
  flex-grow: 1;
  overflow: auto;
}
.clipboard .buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
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
.collections {
  display: flex;
  gap: 5px;
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
}
</style>
