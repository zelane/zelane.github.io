<script setup>
import { reactive, ref, watch, onBeforeMount  } from 'vue';
import { useCollections } from '../stores/collections';
import { useCardView, useClipboard } from '../stores/cards';
import { useMeta } from '../stores/meta';
import { useUI } from '../stores/ui';
import Filters from './Filters.vue';
import CardView from './CardView.vue';
import CardList from './CardList.vue';
import Precon from './Precon.vue';
import CollectionsManager from './CollectionsManager.vue';
import SideBar from './SideBar.vue';
import CardSource from './CardSource.vue';
import InfoBar from './InfoBar.vue';
import { useUser } from '../stores/user';

const clipboard = useClipboard();
const collections = useCollections();
const cards = useCardView();
const meta = useMeta();
const user = useUser();

const uiGlobal = useUI();

const ui = reactive({
  view: '',
  set: '',
  precons: '',
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


onBeforeMount(async () => {
  await collections.init();
  await meta.init();
  try {
    const clipboardCards = await collections.getCards(['clipboard']);
    if(clipboardCards) clipboard.addMany(clipboardCards);
    const channel = new BroadcastChannel("clipboard");
    channel.addEventListener("message", (e) => {
      if(e.data === 'update') {
        clipboard.loadCollections(['clipboard']);
      }
    });
  }
  catch (e) {
    console.error(e);
  }
  user.loadCookie();
});

</script>

<template>
  <div
    id="window"
  >
    <div
      id="sidebar" 
      :class="{show: ui.showMenu}"
    >
      <CardSource />
      <Filters />
    </div>

    <div
      id="main"
      class="main"
      :data-source="uiGlobal.source"
    >
      <InfoBar />
      <CardSource class="card-source" />
      <SideBar />

      <Precon
        v-show="uiGlobal.mainView === 'precon'"
        @close="uiGlobal.mainView = 'cards'"
      />

      <div 
        @click="uiGlobal.sidebar.show = false"
      >
        <CardView
          :store="cards"
          v-if="uiGlobal.mainView === 'cards'"
          :actions="uiGlobal.cardActions"
        />
        <CardList 
          :cards="cards.filtered"
          v-if="uiGlobal.mainView === 'list'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
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

#main {
  position: relative;
  flex-grow: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.card-source {
  display: none;
}
@media (max-width: 640px) {
  .info-bar {
    display: none;
  }
  .card-source {
    display: initial;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background-color: var(--colour-sidebar);
    z-index: 4;
    padding: .5rem 1rem;
    box-shadow: var(--default-shadow);
  }
  #window {
    flex-direction: column;
  }
  #main {
    order: 0;
    width: 100%;
    height: auto;
  }
  #sidebar {
    display: none;
    position: absolute;
    inset: 0;
    z-index: 5;
    transform: translate(0, 100%);
    transition: all 0.2s;
    width: 100%;
    overflow: visible;
    min-width: 0;
  }
  #sidebar.show {
    transform: translate(0, 0);
    overflow: auto;
  }
}
</style>
