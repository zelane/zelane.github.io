<script setup>
import { reactive, ref, watch, unref } from 'vue';
import Multiselect from '@vueform/multiselect';
import Dexie from 'dexie';
import Filters from './Filters.vue';
import CardParser from './CardParser.vue';
import { deepUnref } from 'vue-deepunref';
import CardList from './CardList.vue';

const db = new Dexie('mtg');
db.version(3).stores({
  collections: '&name'
});
const info = reactive({ count: 0, total_value: 0 });
const clipboard = reactive({cards: new Map()});
const ui = reactive({
  upload: false, 
  clipboard: false, 
  prints: false, 
  sidebarShow: false, 
  sidebar:"clipboard", 
  menu: false, 
  random: {},
  cards: 'collection',
  zoom: 0
});
const filters = reactive({sets: []});
const sets = new Map();
let loading = ref(false);
let setLoading = ref(false);

const cards = reactive({ collections: [], all: [], filtered: [], sort: 'Price', prints: [] });
let activeCollections = reactive({ value: [] });

const cachedGet = async (cache, url, force=false) => {
  // url = encodeURI(url);
  const request = new Request(url, {
    'cache': force === true ? 'reload' : 'default'
  });
  if(force === true) {
    await cache.delete(request);
  }
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
      if(card === undefined) {
        continue;
      }
      const cardKey = card.id + card.is_foil + card.is_etched;
      if(cardMap.has(cardKey)) {
        let ex = cardMap.get(cardKey);
        ex.count = parseInt(ex.count) + parseInt(card.count);
        cardMap.set(cardKey, ex);
      }
      else {
        cardMap.set(cardKey, card);
      }
    }
  }
  cards.all = [...cardMap.values()];
};

const loadSet = async (setId, force=false) => {
  loadSearch('e:' + setId, 'prints', force);
  // let json = await cachedGet(getCache, 'http://localhost:3001/set/?set=' + setId, force);
  // cards.all = json.data;
};

const loadSearch = async (query, unique='prints', force=false) => {
  let url = 'https://api.scryfall.com/cards/search?' + new URLSearchParams({
    q: `${query} -border:silver -is:digital`,
    unique: unique
  });
  let _cards = [];
  loading.value = true;
  try {
    while (true) {
      let json = await cachedGet(getCache, url, force);
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
      cards.collections.splice(cards.collections.indexOf(name), 1);
      activeCollections.value.splice(activeCollections.value.indexOf(name), 1);
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
  cards.collections = keys;
  cards.collections.sort();
  activeCollections.value = [keys[0]];
});

let getCache = null;
caches.open('cardDataCache').then(async (cache) => {
  getCache = cache;
  let as = await cachedGet(cache, 'https://api.scryfall.com/sets');
  as.data.forEach(set => sets.set(set.code, set));
});

const updateCollection = async (name, cardData, syncCode=undefined) => {
  await db.collections.put({ name: name, cards: cardData, syncCode: syncCode });
  if (!cards.collections.includes(name)) {
    cards.collections.push(name);
  }
  cards.collections.sort();
  activeCollections.value = [name];
};

const exportList = async (format) => {
  let list = "";
  if(format === 'mtgo') {
    for(const card of clipboard.cards.values()) {
      list += `${card.count || 1} ${card.name} \n`;
    };
  }
  else if(format === 'mtga') {
    // 1 Ainok Bond-Kin (mb1) 13
    for(const card of clipboard.cards.values()) {
      list += `${card.count || 1} ${card.name} (${card.set}) ${card.collector_number}\n`;
    };
  }
  else if(format === 'mkm') {
    for(const card of clipboard.cards.values()) {
      list += `${card.count || 1} ${card.name} (${card.set_name})\n`;
    };
  }
  else if (format === 'moxfield') {
    list = '"Count","Tradelist Count","Name","Edition","Condition","Language","Foil","Tags","Last Modified","Collector Number"\n';
    for(const card of clipboard.cards.values()) {
      list += `"${card.count || 1}","0","${card.name}","${card.set}","Near Mint","English","","","2022-03-22 02:52:33.210000","${card.collector_number}"\n`;
    };
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
      existing[0].count += newCard.count || 1;
    }
  }
  await db.collections.put(collection);
  if(activeCollections.value.includes(set)) {
    cards.all = cards.all.concat(newCard);
  }
};

const groupBySet = (cards) => {
  const grouped = cards.reduce((map,card) => {
    const current = map.get(card.set);
    map.set(card.set, current ? current + 1 : 1);
    return map;
  }, new Map());
  return new Map([...grouped.entries()].sort((a, b) => a[1] > b[1] ? -1 : 1));
};

const clipCards = (cards, countAll=false) => {
  cards.forEach(card => {
    let clipcard = clipboard.cards.get(card.id);
    // if(!card.count) card.count = 1;
    if(!card.price) card.price = parseFloat(card.prices.eur || parseFloat(card.prices.usd) * 0.9 || 0);
    if(!clipcard) {
      clipcard = {...card};
      if(!card.count) clipcard.count = 1;
    }
    else {
      clipcard.count += countAll ? (card.count || 1) : 1;
    }
    clipboard.cards.set(clipcard.id, clipcard);
  });
};

const setMenu = item => {
  if(item === ui.sidebar) ui.sidebarShow = !ui.sidebarShow;
  else {
    ui.sidebarShow = true;
    ui.sidebar = item;
  }
};

const setCards = item => {
  if(ui.cards === item) return;
  ui.cards = item;
  if(item === 'collection') {
    loadCollections(activeCollections.value);
  }
  else if(item === 'set') {
    if(ui.set) loadSet(ui.set);
  }
  else if(item === 'search') {
    if(ui.search) loadSearch(ui.search, 'cards');
  }
};

</script>

<template>
  <div id="window">
    <div id="sidebar">
      <div class="filter-group cards">
        <!-- <h3>Cards</h3> -->
        <div class="selector tabs">
          <a
            href="#"
            v-for="name in ['collection', 'set', 'search']"
            :key="name"
            @click="setCards(name)"
            :class="{selected: ui.cards === name}"
          >{{ name }}</a>
        </div>
        <div class="view">
          <div
            class="item collection"
            v-if="ui.cards === 'collection'"
          >
            <Multiselect
              v-model="activeCollections.value"
              :options="cards.collections"
              mode="tags"
              :searchable="true"
            />
            <button
              class="small add icon icon-settings"
              @click="ui.upload = !ui.upload"
            />
          </div>
          <div
            class="item"
            v-if="ui.cards === 'set'"
          >
            <Multiselect
              v-model="ui.set"
              :options="[...sets.values()]"
              :searchable="true"
              label="name"
              value-prop="code"
              mode="single"
              @select="loadSet"
              @loading="loading.value = true"
            />
            <button
              class="small icon icon-loop"
              @click="loadSet(ui.set, true)"
            />
          </div>
          <div
            class="item"
            v-if="ui.cards === 'search'"
          >
            <input
              type="search"
              v-model="ui.search"
              @keyup.enter="e => loadSearch(e.currentTarget.value, 'cards')"
            >
            <a
              href="https://scryfall.com/docs/syntax"
              target="_blank"
              class="button small"
            >?</a> 
          </div>
        </div>
      </div>
      
      <Filters
        @change="filtersChanged"
        :cards="cards.all"
        :collections="cards.collections"
        :db="db"
        :sort="cards.sort"
        :filters="filters"
      />
    </div>

    <div
      id="main"
    >
      <CardParser
        v-show="ui.upload"
        @change="updateCollection"
        @close="ui.upload=false"
        @delete="deleteCollections"
        :db="db"
        :collections="cards.collections"
        :set-ids="new Set(sets.keys())"
      />

      <div
        class="info-bar"
        v-if="!ui.upload"
      >
        <span>Count: {{ info.count }}</span>
        <span>Value: {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(info.total_value) }}</span>


        <span class="sort">
          <Multiselect
            v-model="cards.sort"
            :options="['Mana', 'Price', 'Count', 'Released']"
            mode="single"
            :can-clear="false"
          />
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
        v-if="!ui.upload"
        :class="{'show': ui.sidebarShow}"
      >
        <div
          class="menu"
        >
          <div
            class="item" 
            @click.stop="setMenu(name)"
            v-for="name in ['clipboard', 'prints', 'settings']"
            :key="name"
            :class="name"
          >
            <span
              class="icon"
              :class="'icon-' + name"
            />
            <!-- <span>{{ clipboard.cards.size }}</span> -->
          </div>
        </div>

        <div
          class="settings"
          v-show="ui.sidebar === 'settings'"
        >
          <h3>Settings</h3>
          <span class="zoom">
            <label for="zoom">Zoom</label>
            <input
              id="zoom"
              type="number"
              v-model="ui.zoom"
            >
          </span>
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
            @clip="card => clipCards([card])"
          />
        </div>

        <div
          class="info"
          v-if="ui.sidebar === 'info'"
        >
          <h3>Selection info</h3>
          <div class="sets">
            <div
              class="set"
              v-for="[set, count] in groupBySet(cards.filtered).entries()"
              :key="set"
            >
              <img :src="sets.get(set).icon_svg_uri">
              <a
                href="#"
                @click="filters.sets=[set]"
              >
                {{ sets.get(set).name }}</a>
              
              <span>{{ count }}</span> 
            </div>
          </div>
        </div>
        
        <div
          class="clipboard"
          v-show="ui.sidebar === 'clipboard'"
        >
          <h3>Clipboard {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format([... clipboard.cards.values()].reduce((sum, a) => sum += a.price * a.count, 0)) }}</h3>
          <div class="clip-cards">
            <div
              class="clip-card"
              v-for="card in clipboard.cards.values()"
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
                <button @click="exportList('mtga')">
                  MTGA
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
                  v-for="col in cards.collections"
                  @click="addToSet(col, clipboard.cards.values())"
                  :key="col"
                >
                  {{ col }}
                </button>
              </div>
            </div>
            <button @click="clipCards(cards.filtered, true)">
              Clip All
            </button>
            <button @click="clipboard.cards.clear()">
              Clear
            </button>
          </div>
        </div>
      </div>

      <div 
        @click="ui.sidebarShow = false"
      >
        <CardList
          :cards="cards.filtered"
          :zoom="ui.zoom"
          :loading="loading"
          @clip="card => clipCards([card])"
          @view-prints="cardName => loadPrints(cardName)"
          v-if="ui.upload === false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-group.cards{
  display: flex;
}

.cards .tabs {
  display: flex;
  gap: .5rem;
  gap: 1rem;
  line-height: 2rem;
  width: 100%;
  text-transform: capitalize;
  margin-bottom: .5rem;
  transition: all 0.2s;
}
.tabs a {
  /* padding: 0 1rem; */
  /* border-bottom: 2px solid var(--colour-input-grey); */
  color: var(--colour-light-font);
}
.tabs a.selected {
  border-top-right-radius: 2px;
  border-top-left-radius: 2px;
  /* background: var(--colour-input-grey); */
  /* box-shadow: var(--default-shadow); */
  /* color: var(--colour-light-font); */
  color: var(--colour-anchor);
  border-bottom-color: var(--colour-anchor);
}
.cards .view {
  width: 100%;
}
.cards .view .item {
  width: 100%;
}
.view .item {
  display: flex;
  gap: .5rem;
}
.cards .view .item input {
  width: 100%;
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
  user-select: none;
  transform: translate(-100%, 0);
  left: 0px;
  display: flex;
  flex-direction: column-reverse;
  gap: .5rem 0;
}
.menu .item {
  padding: 1rem 1rem;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  background-color: var(--colour-input-grey);
  box-shadow: var(--default-shadow);
  cursor: pointer;
}
.menu .item span {
  vertical-align: middle;
}
.menu .item .icon {
  /* margin-right: .5rem; */
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
  max-height: 50vh;
  overflow: auto;
  position: absolute;
  bottom: 3.5rem;
  /* max-width: 17rem; */
  right: 0;
}
.menu-button .v-menu button {
  max-width: 17rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  max-width: calc(100vw - 3rem);
  transform: translate(100%, 0);
  background-color: var(--colour-sidebar);
  transition: all 0.2s;
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
  line-height: 1.8;
  flex-grow: 1;
  padding: 1rem 1rem;
}
.sets .set {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: .5rem;
}
.sets .set a {
  flex-grow: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.sets .set img {
  height: 1.2rem;
  min-width: 44px;
  filter: invert(50%) sepia(100%) saturate(285%) hue-rotate(227deg) brightness(105%) contrast(100%);
}
.prints {
  padding: 1rem 2rem;
}
.clipboard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem 2rem;
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
  inset: 0;
  overflow: hidden;
}
#sidebar {
  min-width: 380px;
  width: 400px;
  text-align: left;
  padding: 40px 20px;
  background-color: var(--colour-sidebar);
  overflow: auto;
  gap: 1.5rem 0;
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
    order: 0;
    width: 100%;
    height: auto;
  }
  #sidebar {
    height: 30vh;
    order: 1;
    width: 100%;
    min-width: 0;
    padding: 5vw;
	  /* scroll-snap-type: y mandatory; */
  }
  /* .filter-group {
    scroll-snap-align: start;
  } */
}
</style>
