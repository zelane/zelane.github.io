<script setup>
import { reactive, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import { useCollections } from '../stores/collections';
import { useCardView } from '../stores/cards';
import { useMeta } from '../stores/meta';
import Multiselect from '@vueform/multiselect';
import Filters from './Filters.vue';
import CardView from './CardView.vue';
import CardList from './CardList.vue';
import Precon from './Precon.vue';
import CardParser from './CardParser.vue';
import CardExporter from './CardExporter.vue';
import ClipBoard from './ClipBoard.vue';
import CollectionsManager from './CollectionsManager.vue';
import PrintsView from './PrintsView.vue';

const collections = useCollections();
const cards = useCardView();
const meta = useMeta();

const router = useRouter();
const route = useRoute();

const ui = reactive({
  mainView: 'cards',
  sidebarShow: false,
  sidebar:"clipboard", 
  view: '',
  set: '',
  precons: '',
  zoom: 0,
  showMenu: false
});

let to = null;
watch(cards.filters, async () => {
  clearTimeout(to);
  to = setTimeout(async () => {
    cards.applyFilters();
  }, 500);
});

watch(cards.sort, () => {
  cards.applyFilters();
});

const loadCollections = collections => {
  router.push({ path: '/collection', query: {q: encodeURIComponent(collections.join('~'))} });
};

const loadSet = (setId, force) => {
  router.push({ path: '/set', query: {q: setId, force: true} });
};

const loadSearch = async (query, unique='prints', force=false) => {
  router.push({ path: '/search', query: {q: query, unique: unique, force: force} });
};

const loadPrecon = (name) => {
  router.push({ path: '/precons', query: {q: name} });
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
  if(view) {
    ui.view = view;
    if(Object.keys(params).length === 0) {
      console.log("empty");
      return;
    }
    else if(view === 'collection') {
      if(params.code) {
        await cards.loadSync(params.code);
      }
      else {
        ui.collections = decodeURIComponent(params.q).split("~");
        await cards.loadCollections(ui.collections);
      }
    }
    else if(view === 'set') {
      ui.set = params.q;
      await cards.loadSet(ui.set, params.force);
    }
    else if(view === 'precons') {
      ui.precons = params.q;
      await cards.loadPrecon(params.q);
    }
    else if(view === 'search') {
      await cards.loadSearch(params.q, params.unique, params.force);
    }
  }
};

const init = async () => {
  await collections.init();
  await meta.init();
  if(route.params.view && route.query) {
    await loadRoute(route.params.view, route.query);
  }
  else {
    ui.view = 'collection';
    loadCollections([collections.all[0]]);
  }
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
              v-model="collections.open"
              :options="collections.all"
              mode="tags"
              :searchable="true"
              @change="loadCollections"
            />
            <button
              class="small add icon icon-settings"
              @click="() =>{ ui.mainView = 'upload' }"
            />
          </div>
          <div
            class="item"
            v-if="ui.view === 'set'"
          >
            <Multiselect
              v-model="ui.set"
              :options="meta.sets"
              :searchable="true"
              label="name"
              value-prop="code"
              mode="single"
              @select="x => loadSet(x)"
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
              :options="meta.precons"
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
              @click="ui.mainView = 'precon'"
            />
          </div>
        </div>
      </div>
      
      <Filters />
    </div>

    <div
      id="main"
      class="main"
    >
      <CollectionsManager
        v-show="ui.mainView === 'upload'"
        @change="name => cards.loadCollections([name])"
        @close="ui.mainView = 'cards'"
      />

      <Precon
        v-show="ui.mainView === 'precon'"
        @close="ui.mainView = 'cards'"
      />

      <div
        class="info-bar"
        v-if="ui.mainView === 'cards' || ui.mainView === 'list'"
      >
        <span>Count: {{ cards.count }}</span>
        <span>Value: {{ cards.value }}</span>

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
            @click="ui.mainView = 'cards'"
            :class="{selected: ui.mainView === 'cards'}"
          />
          <span
            class="cardView icon icon-list"
            @click="ui.mainView = 'list'"
            :class="{selected: ui.mainView === 'list'}"
          />
        </span>
      </div>

      <div
        class="sidepanel"
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
              @parsed="cards.loadCollections"
            />
            <CardExporter :cards="cards.filtered" />
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
          <PrintsView
            @changed="() => {ui.sidebar = 'prints'; ui.sidebarShow = true}"
          />
        </div>

        <!-- <div
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
        </div> -->
        <ClipBoard
          v-show="ui.sidebar === 'clipboard'"
        />
      </div>

      <div 
        @click="ui.sidebarShow = false"
      >
        <CardView
          :store="cards"
          :zoom="ui.zoom"
          v-if="ui.mainView === 'cards'"
        />
        <CardList 
          :cards="cards.filtered"
          v-if="ui.mainView === 'list'"
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
