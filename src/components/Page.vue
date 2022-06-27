<script setup>
import { reactive, ref } from 'vue';
import Multiselect from '@vueform/multiselect';
import Dexie from 'dexie';
import Filters from './Filters.vue';
import CardView from './CardView.vue';
import CardList from './CardList.vue';
import Precon from './Precon.vue';
import { useToast } from "vue-toastification";
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import CardParser from './CardParser.vue';
import CardExporter from './CardExporter.vue';
import ClipBoard from './ClipBoard.vue';
import { useClipboard } from '../stores/clipboard';
import { useCollections } from '../stores/collections';
import CollectionsManager from './CollectionsManager.vue';


const clipboard = useClipboard();
const collections = useCollections();
collections.init();

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const router = useRouter();
const route = useRoute();

const toast = useToast();
const info = reactive({ count: 0, total_value: 0 });

const ui = reactive({
  upload: false, 
  precon: false,
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

const cards = reactive({ all: [], filtered: [], sort: {val: 'Price', dir: 1}, prints: [] });

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

const _loadCollections = async (names) => {
  ui.collections = names;
  cards.all = await collections.getCards(names);
};

const loadSync = async code => {
  const resp = await fetch(backendUrl + '/collection?id=' + code);
  const json = await resp.json();
  cards.all = json.data;
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
  const _cards = await cachedGet(getCache, `${backendUrl}/precon?name=${name}`, true);
  cards.all = _cards.data;
};

const deleteCard = async (card) => {
  if(confirm(`Are you sure you want to delete ${card.name} from ${ui.collections.join(', ')}`)) {
    await collections.deleteCard(ui.collections, card.id);
    _loadCollections(card.collections);
  };
};

const filtersChanged = async (filteredCards, count, value) => {
  info.count = count;
  info.total_value = value;
  cards.filtered = filteredCards;
  loading.value = false;
};

const groupBySet = (cards) => {
  const grouped = cards.reduce((map,card) => {
    const current = map.get(card.set);
    map.set(card.set, current ? current + 1 : 1);
    return map;
  }, new Map());
  return new Map([...grouped.entries()].sort((a, b) => a[1] > b[1] ? -1 : 1));
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

  if(route.params.view && route.query) {
    await loadRoute(route.params.view, route.query);
  }
  else {
    ui.view = 'collection';
    // await loadRoute('collection', {q: defaultCollections});
    // ui.collections = defaultCollections;
    loadCollections([collections.names[0]]);
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

const clip = card => {
  clipboard.add(card);
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
              :options="collections.names"
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
        :sort="cards.sort"
        :filters="filters"
      />
    </div>

    <div
      id="main"
      class="main"
    >
      <CollectionsManager
        v-show="ui.upload"
        @change="name => _loadCollections([name])"
        @close="ui.upload=false"
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
            v-for="name in ['add', 'clipboard', 'prints', 'settings']"
            :key="name"
            :class="name"
          >
            <span
              class="icon"
              :class="'icon-' + name"
            />
          </div>
        </div>

        <div
          class="add"
          v-show="ui.sidebar === 'add'"
        >
          <span>
            <CardParser
              @parsed="_loadCollections"
              :collections="ui.collections"
              :set-ids="new Set(sets.keys())"
            />
            <CardExporter :cards="cards.all" />
          </span>
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
            @clip="card => clip(card)"
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
        <ClipBoard
          v-show="ui.sidebar === 'clipboard'"
          :cards="cards.filtered"
        />
      </div>

      <div 
        @click="ui.sidebarShow = false"
      >
        <CardView
          :cards="cards.filtered"
          :zoom="ui.zoom"
          :loading="loading"
          @clip="card => clip(card)"
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
  padding: 1rem 2rem;
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
