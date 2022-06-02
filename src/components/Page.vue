<script setup>
import { reactive, ref, watch, watchEffect, unref, onMounted  } from 'vue';
import Multiselect from '@vueform/multiselect';
import Dexie from 'dexie';
import Filters from './Filters.vue';
import CardParser from './CardParser.vue';
import { deepUnref } from 'vue-deepunref';
import CardView from './CardView.vue';
import CardList from './CardList.vue';
import Precon from './Precon.vue';
import MenuButton from './MenuButton.vue';
import { useToast } from "vue-toastification";
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const props = defineProps({
  view: {
    type: String,
    default: 'collection'
  }
});
const router = useRouter();
const route = useRoute();

const toast = useToast();
const db = new Dexie('mtg');
db.version(3).stores({
  collections: '&name'
});
const info = reactive({ count: 0, total_value: 0 });
const clipboard = reactive({cards: new Map()});
const ui = reactive({
  upload: false, 
  precon: false,
  clipboard: false, 
  prints: false, 
  sidebarShow: false, 
  sidebar:"clipboard", 
  menu: false, 
  random: {},
  view: '',
  set: '',
  precons: '',
  collections: [],
  zoom: 0,
  cardView: 'card',
  showMenu: false,
});
const filters = reactive({sets: []});
const sets = new Map();
const precons = reactive({value: []});
let loading = ref(false);
let setLoading = ref(false);

const cards = reactive({ collections: [], all: [], filtered: [], sort: {val: 'Price', dir: 1}, prints: [] });

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

const loadCollections = collections => {
  router.push({ path: '/collection', query: {q: encodeURIComponent(collections.join('~'))} });
};

const loadSync = async code => {
  const resp = await fetch(backendUrl + '/collection?id=' + code);
  const json = await resp.json();
  cards.all = json.data;
};

const _loadCollections = async (names) => {
  let cardMap = new Map();
  for(const name of names) {
    let collection = await db.collections.get({ name: name });
    if(collection) {
      for(const card of collection.cards) {
        if(card === undefined) {
          continue;
        }
        const cardKey = card.id + card.finish;
        if(cardMap.has(cardKey)) {
          let ex = cardMap.get(cardKey);
          ex.count = parseInt(ex.count) + parseInt(card.count);
          ex.collections.push(collection.name);
          cardMap.set(cardKey, ex);
        }
        else {
          card.collections = [collection.name];
          cardMap.set(cardKey, card);
        }
      }
    }
  }
  cards.all = [...cardMap.values()];
};

const loadSet = (setId, force) => {
  router.push({ path: '/set', query: {q: setId, force: force} });
};

const _loadSet = async (setId, force=false) => {
  // await _loadSearch('e:' + setId, 'prints', force);
  let json = await cachedGet(getCache, `${backendUrl}/set/?set=` + setId, true);
  cards.all = json.data;
};

const loadSearch = async (query, unique='prints', force=false) => {
  router.push({ path: '/search', query: {q: query, unique: unique, force: force} });
};

const _loadSearch = async (query, unique='prints', force=false) => {
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

const loadPrecon = (name) => {
  router.push({ path: '/precons', query: {q: name} });
};

const _loadPrecon = async (name) => {
  const _cards = await cachedGet(getCache, `${backendUrl}/precon?name=${name}`);
  cards.all = _cards.data;
};

const deleteCollections = async (names) => {
  if(confirm(`Are you sure you want to delete ${names.join(', ')}?`)) {
    names.map(async name => {
      await db.collections.delete(name);
      cards.collections.splice(cards.collections.indexOf(name), 1);
      ui.collections.splice(ui.collections.indexOf(name), 1);
    });
  }
  else {
    return;
  }
};

const deleteCard = async (card) => {
  console.log(`Deleting ${card.name} from ${card.collections.join(', ')}`);
  for(const colName of card.collections) {
    const col = await db.collections.get({ name: colName });
    const newCards = col.cards.filter(c => c.id !== card.id);
    await db.collections.update(colName, {cards: newCards});
  }
  loadView(ui.view);
};

const filtersChanged = async (filteredCards, count, value) => {
  info.count = count;
  info.total_value = value;
  cards.filtered = filteredCards;
  loading.value = false;
};

const updateCollection = async (name, cardData, syncCode=undefined) => {
  await db.collections.put({ name: name, cards: cardData, syncCode: syncCode });
  if (!cards.collections.includes(name)) {
    cards.collections.push(name);
  }
  cards.collections.sort();
  loadCollections([name]);
};

const exportList = async (format) => {
  let list = "";
  if(format === 'mtgo') {
    for(const card of clipboard.cards.values()) {
      list += `${card.count || 1} ${card.name} \n`;
    };
  }
  else if(format === 'mtga') {
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
  toast(`Copied to Clipboard`);
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
  if(ui.collections.includes(set)) {
    cards.all = cards.all.concat(newCards);
  }
  toast(`${newCards.length} added to ${set}`);
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

const loadView = async item => {
  if(ui.view === item) return;
  ui.view = item;
  if(item === 'collection') {
    if(ui.collections) loadCollections(ui.collections);
  }
  else if(item === 'set') {
    if(ui.set) loadSet(ui.set);
  }
  else if(item === 'precon') {
    if(ui.precons) loadPrecon(ui.precons);
  }
  else if(item === 'search') {
    if(ui.search) await loadSearch(ui.search, 'cards');
  }
};

const loadRoute = async (view, params) => {
  // console.log("Loading route", view, params);
  if(view) {
    ui.view = view;
    if(Object.keys(params).length === 0) {
      console.log("empty");
      return;
    }
    else if(view === 'collection') {
      if(params.code) {
        loadSync(params.code);
      }
      else {
        ui.collections = decodeURIComponent(params.q).split("~");
        await _loadCollections(ui.collections);
      }
    }
    else if(view === 'set') {
      console.log(params.force);
      ui.set = params.q;
      await _loadSet(ui.set, params.force);
    }
    else if(view === 'precons') {
      ui.precons = params.q;
      await _loadPrecon(params.q);
    }
    else if(view === 'search') {
      await _loadSearch(params.q, params.unique, params.force);
    }
  }
};

let getCache = null;

const init = async () => {
  const cache = await caches.open('cardDataCache');
  getCache = cache;
  let as = await cachedGet(cache, 'https://api.scryfall.com/sets', true);
  as.data.forEach(set => {
    if(set.digital) return;
    sets.set(set.code, set);
  });

  let pcs = await cachedGet(cache, `${backendUrl}/precons`, true);
  pcs.data.sort((a,b) => Date.parse(a.releaseDate) < Date.parse(b.releaseDate) ? 1 : -1);
  let groups = {};
  for(const pc of pcs.data) {
    let set = sets.get(pc.set).name;
    if(groups[set]) {
      groups[set].push(pc);
    }
    else {
      groups[set] = [pc];
    }
  }
  precons.value = [];
  for(const [k, v] of Object.entries(groups)) {
    precons.value.push({label: k, options: v});
  };

  let defaultCollections = [];
  const collections = await db.collections.toCollection().primaryKeys();
  if (collections.length !== 0) {
    cards.collections = collections;
    cards.collections.sort();
    defaultCollections = [collections[0]];
  };

  if(route.params.view && route.query) {
    await loadRoute(route.params.view, route.query);
  }
  else {
    ui.view = 'collection';
    // await loadRoute('collection', {q: defaultCollections});
    // ui.collections = defaultCollections;
    loadCollections(defaultCollections);
  }
  return cache;
};

init();

onBeforeRouteUpdate(async (a, b) => {
  await loadRoute(a.params.view, a.query);
});

let touchYPos = 0;
const sidebar = ref(null);

const touchStart = (e) => {
  touchYPos = e.touches[0].screenY;
};

const touchEnd = (e) => {
  const delta = e.changedTouches[0].screenY - touchYPos;
  if(ui.showMenu === true && delta > 50 && sidebar.value.scrollTop === 0) {
    ui.showMenu = false;
  }
  else if(ui.showMenu === false && delta < -50) {
    sidebar.value.scrollTop = 0;
    ui.showMenu = true;
  }
};

</script>

<template>
  <div
    id="window"
  >
    <div
      ref="sidebar"
      id="sidebar" 
      :class="{show: ui.showMenu}"
      @touchstart="touchStart"
      @touchend="touchEnd"
    >
      <div
        class="tab"
        @click.stop="ui.showMenu = !ui.showMenu"
      >
        <span class="icon icon-keyboard_arrow_up" />
      </div>
      <div class="filter-group cards">
        <!-- <h3>Cards</h3> -->
        <div class="selector tabs">
          <a
            v-for="name in ['collection', 'set', 'precons', 'search']"
            :key="name"
            @click="loadView(name)"
            :class="{selected: ui.view === name}"
          >{{ name }}</a>
        </div>
        <div class="view">
          <div
            class="item collection"
            v-if="ui.view === 'collection'"
          >
            <Multiselect
              v-model="ui.collections"
              :options="cards.collections"
              mode="tags"
              :searchable="true"
              @change="loadCollections"
              @loading="loading.value = true"
            />
            <button
              class="small add icon icon-settings"
              @click="() =>{ ui.upload = !ui.upload; ui.showMenu = false }"
            />
          </div>
          <div
            class="item"
            v-if="ui.view === 'set'"
          >
            <Multiselect
              v-model="ui.set"
              :options="[...sets.values()]"
              :searchable="true"
              label="name"
              value-prop="code"
              mode="single"
              @select="x => loadSet(x)"
              @loading="loading.value = true"
            />
            <button
              class="small icon icon-loop"
              @click="loadSet(ui.set, true)"
            />
          </div>
          <div
            class="item"
            v-if="ui.view === 'search'"
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
          <div
            class="item"
            v-if="ui.view === 'precons'"
          >
            <Multiselect
              v-model="ui.precons"
              type="single"
              :searchable="true"
              :options="precons.value"
              :groups="true"
              label="name"
              value-prop="name"
              @select="loadPrecon"
            >
              <template #option="{ option }">
                <span class="precon">
                  <span class="name">{{ option.name }}</span>
                  <span
                    v-for="c in option.colours.split('')"
                    :class="`icon icon-${c}`"
                    :key="c"
                  />
                </span>
              </template>
            </Multiselect>
            <button
              class="small icon icon-plus"
              @click="ui.precon=!ui.precon"
            />
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
      class="main"
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

      <Precon
        v-show="ui.precon"
      />

      <div
        class="info-bar"
        v-if="!ui.upload"
      >
        <span>Count: {{ info.count }}</span>
        <span>Value: {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(info.total_value) }}</span>


        <span class="sort">
          <Multiselect
            v-model="cards.sort.val"
            :options="['Mana', 'Type', 'Price', 'Count', 'Released']"
            mode="single"
            :can-clear="false"
          />
          <div class="dir">
            <div
              class="up icon icon-keyboard_arrow_up"
              :class="{selected: cards.sort.dir == -1}"
              @click="cards.sort.dir = -1"
            />
            <div
              class="up icon icon-keyboard_arrow_down"
              @click="cards.sort.dir = 1"
              :class="{selected: cards.sort.dir == 1}"
            />
          </div>
        </span>

        <span class="view">
          <span
            class="cardView icon icon-copy"
            @click="ui.cardView = 'card'"
            :class="{selected: ui.cardView === 'card'}"
          />
          <span
            class="cardView icon icon-list"
            @click="ui.cardView = 'list'"
            :class="{selected: ui.cardView === 'list'}"
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
          <CardView
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
            <MenuButton 
              text="Export"
              :actions="{
                'MTGO': 'mtgo',
                'MTGA': 'mtga',
                'MKM': 'mkm',
                'Moxfield': 'moxfield',
              }"
              @click="exportList"
            />
            
            <MenuButton 
              text="Add to set"
              :actions="Object.fromEntries(cards.collections.map(col => [col, col]))"
              @click="col => addToSet(col, clipboard.cards.values())"
            />

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
        <CardView
          :cards="cards.filtered"
          :zoom="ui.zoom"
          :loading="loading"
          @clip="card => clipCards([card])"
          @view-prints="loadPrints"
          @delete="deleteCard"
          v-if="ui.upload === false && ui.cardView === 'card'"
        />
        <CardList 
          :cards="cards.filtered"
          v-if="ui.upload === false && ui.cardView === 'list'"
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
  cursor: pointer;
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
.info-bar .view {
  letter-spacing: .5rem;
}
.info-bar .view .cardView {
  cursor: pointer;
}
.info-bar .view .cardView.selected {
  color: var(--colour-anchor);
}
select {
  background-color: var(--colour-input-grey);
  color: var(--colour-light-font);
  height: 2.5rem;
  border: none;
  box-shadow: var(--default-shadow);
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
.info-bar .sort {
  display: flex;
  gap: 1em;
  align-items: center;
}
.sort .dir .icon{
  cursor: pointer;
}
.sort .dir .icon.selected {
  color: var(--colour-anchor);
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
.sidepanel .cards {
  grid-template-columns: auto;
  padding: 3rem;
}
.sidepanel .card {
  min-width: 100%;
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
.multiselect-options .precon {
  display: flex;
  gap: .2em;
  width: 100%;
}
.precon .name {
  display: inline-block;
  width: 100%;
}
.precon .icon-R {
  color: var(--colour-red);
}
.precon .icon-G {
  color: var(--colour-green);
}
.precon .icon-B {
  color: var(--colour-black);
}
.precon .icon-U {
  color: var(--colour-blue);
}
.precon .icon-W {
  color: var(--colour-white);
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
  position: relative;
  min-width: 380px;
  width: 400px;
  text-align: left;
  padding: 40px 20px;
  background-color: var(--colour-sidebar);
  overflow-x: visible;
  overflow-y: auto;
  gap: 1.5rem 0;
  display: flex;
  flex-direction: column;
}
#sidebar .tab {
  display: none;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--colour-input-grey);
  text-align: center;
  line-height: 2rem;
  transform: translate(0, -100%);
  border-radius: 8px 8px 0 0;
  box-shadow: var(--default-shadow);

  margin: auto;
  height: 3rem;
  width: 4rem;
  line-height: 3rem;
  font-size: 1.5rem;
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
    position: absolute;
    inset: 0;
    z-index: 5;
    transform: translate(0, 100%);
    transition: all 0.2s;
    width: 100%;
    overflow: visible;
  }
  #sidebar.show {
    transform: translate(0, 0);
    overflow: auto;
  }
  #sidebar .tab {
    display: block;
  }
  .info-bar {
    justify-content: space-evenly;
    gap: 0;
  }
  /* .filter-group {
    scroll-snap-align: start;
  } */
}
</style>
