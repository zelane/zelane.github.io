<script setup>
import { onMounted, reactive } from 'vue';
import { useCardView } from '../stores/cards';
import { useMeta } from '../stores/meta';
import { useCollections } from '../stores/collections';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import Multiselect from '@vueform/multiselect';
import ManaCost from './ManaCost.vue';
import { useUI } from '../stores/ui';
import { useDetails } from '../stores/details';

const router = useRouter();
const cards = useCardView();
const meta = useMeta();
const collections = useCollections();
const route = useRoute();
const uiGlobal = useUI();
const details = useDetails();

const ui = reactive({
  selected: 'collection',
  params: [],
  collections: [],
  set: '',
  precons: '',
  search: '',
  refreshingPrices: false,
  refreshingSet: false,
});

const loadCollections = collections => {
  uiGlobal.source = 'collection';
  router.push({ path: '/collection', query: {q: encodeURIComponent(collections.join('~'))} });
};

const loadSet = (setId, force) => {
 uiGlobal.source = 'set';
  router.push({ path: '/set', query: {q: setId, force: force} });
};

const loadSearch = async (query, unique='prints', force=false) => {
  uiGlobal.source = 'search';
  router.push({ path: '/search', query: {q: query, unique: unique, force: force} });
};

const loadPrecon = (name) => {
  uiGlobal.source = 'precon';
  router.push({ path: '/precons', query: {q: name} });
};

const loadView = async item => {
  if(ui.selected === item) return;
  ui.selected = item;
  details.card = {};
  uiGlobal.details.show = false;
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
    ui.selected = view;
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
      await cards.loadSet(ui.set, params.force === 'true');
    }
    else if(view === 'precons') {
      ui.precons = params.q;
      await cards.loadPrecon(params.q);
    }
    else if(view === 'search') {
      ui.search = params.q;
      await cards.loadSearch(params.q, params.unique, params.force);
    }
  }
};

const refreshPrices = async () => {
  if(ui.refreshingPrices === true) return;
  ui.refreshingPrices = true;
  await collections.refreshPrices();
  await cards.loadCollections(collections.open);
  ui.refreshingPrices = false;
};

const refreshSet = async () => {
  if(ui.refreshingSet === true) return;
  ui.refreshingSet = true;
  await cards.loadSet(ui.set, true);
  ui.refreshingSet = false;
};

onBeforeRouteUpdate(async (a, b) => {
  await loadRoute(a.params.view, a.query);
});

onMounted(async () => {
  if(route.params.view) {
    loadRoute(route.params.view, route.query);
  }
  else {
    // console.log(collections.names);
    // loadRoute('collection', collections.names[0]);
  }
});

</script>

<template>
  <div class="filter-group cards">
    <div class="selector tabs">
      <a
        v-for="name in ['collection', 'set', 'precons', 'search']"
        :key="name"
        @click="loadView(name)"
        :class="{selected: ui.selected === name}"
      >{{ name }}</a>
    </div>
    <div class="view">
      <div
        class="item collections"
        v-if="ui.selected === 'collection'"
      >
        <Multiselect
          v-model="collections.open"
          :options="collections.obj"
          label="name"
          value-prop="name"
          mode="tags"
          :searchable="true"
          @change="loadCollections"
        >
          <template #option="{ option }">
            <span
              class="collection"
              :class="{missing: !option.downloaded}"
            >
              <span class="name">{{ option.name }}</span>
              <span
                class="status icon icon-arrow-down"
                v-if="!option.downloaded"
              />
            </span>
          </template>
        </Multiselect>
        <button
          class="small icon icon-loop"
          :class="{'active': ui.refreshingPrices}"
          :disabled="ui.refreshingPrices"
          @click="refreshPrices"
        />
      </div>
      <div
        class="item"
        v-if="ui.selected === 'set'"
      >
        <Multiselect
          v-model="ui.set"
          :options="meta.sets"
          :searchable="true"
          label="name"
          value-prop="code"
          mode="single"
          @select="x => loadSet(x)"
        >
          <template #option="{ option }">
            <span class="set">
              <img
                class="icon"
                :src="option.icon_svg_uri"
              >
              <span class="name">{{ option.name }}</span>
            </span>
          </template>
        </Multiselect>
        <button
          class="small icon icon-loop"
          :class="{active: ui.refreshingSet}"
          :disabled="ui.refreshingSet"
          @click="refreshSet"
        />
      </div>
      <div
        class="item"
        v-if="ui.selected === 'search'"
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
        v-if="ui.selected === 'precons'"
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
              <ManaCost :mana="option.colours.split('').map(c => `{${c}}`).join('')" />
            </span>
          </template>
        </Multiselect>
        <button
          class="small icon icon-plus"
          @click="uiGlobal.loadMain('precon')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards {
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
.view .item {
  display: flex;
  gap: .5rem;
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
.cards .view .item input {
  width: 100%;
}
.collections {
  display: flex;
  gap: 5px;
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
.set .icon {
  max-height: 1.2em;
  width: 1.5rem;
  vertical-align: middle;
  color: var(--colour-light-font);
  margin-right: .5em;
  filter: invert(100%) saturate(1000%) hue-rotate(150deg);
}
.multiselect-option .is-pointed .set .icon {
  filter: none;
}
.collections .collection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.collections .collection.missing {
  color: #aaa;
}
@media (max-width: 640px) {
  .cards .tabs {
    justify-content: space-evenly;
  }
}
</style>