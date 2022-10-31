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
import CardImage from './CardImage.vue';
import SideBar from './SideBar.vue';
import CardSource from './CardSource.vue';
import CardDetails from './CardDetails.vue';
import InfoBar from './InfoBar.vue';
import { useUser } from '../stores/user';
import { useDetails } from '../stores/details';

const details = useDetails();

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

let touchXPos = 0;
let touchYPos = 0;
const det = ref(null);

const touchStart = (e) => {
  touchXPos = e.touches[0].screenX;
  touchYPos = e.touches[0].screenY;
};

const touchEnd = (e) => {
  const deltaY = e.changedTouches[0].screenY - touchYPos;
  const deltaX = e.changedTouches[0].screenX - touchXPos;
  if(det.value.scrollTop === 0 && details.card && deltaY > 75 && Math.abs(deltaX) < 50) {
    uiGlobal.details.show = false;
    return;
  }
  if(deltaX > 50 && Math.abs(deltaY) < 40) {
    if(uiGlobal.details.index === 0) {
      uiGlobal.details.index = cards.filtered.length - 1;
    }
    else {
      uiGlobal.details.index -= 1;
    }
    const next = cards.filtered[uiGlobal.details.index];
    details.loadDetails(next);
    return;
  }
  if(deltaX < -50 && Math.abs(deltaY) < 40) {
    if(uiGlobal.details.index > cards.filtered.length - 2) {
      uiGlobal.details.index = 0;
    }
    else {
      uiGlobal.details.index += 1;
    }
    const next = cards.filtered[uiGlobal.details.index];
    details.loadDetails(next);
    return;
  }
};

const clickOut = (e) => {
  if(e.target.id === 'details-overlay') {
    uiGlobal.details.show = false;
  }
};

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
        ref="det"
        id="details-overlay"
        class="details"
        :class="{
          show: uiGlobal.details.show
        }"
        @touchstart.passive="touchStart"
        @touchend.passive="touchEnd"
        @wheel="() => {}"
        @click="clickOut"
      >
        <div class="content">
          <CardImage
            :card="details.card" 
            @click.stop=""
          />
          <CardDetails
            :card="details.card"
            :actions="uiGlobal.source === 'collection' ? ['prints', 'clip', 'delete'] : ['prints', 'clip']"
          />
        </div>
      </div>

      <div
        class="card-view"
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
.details {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(0deg, rgb(23, 19, 23) 0%, rgb(23, 19, 23) 20%, rgba(23, 19, 23, 0.8) 100%);
  opacity: 0;
  padding: 1rem;
  transition: transform 0.2s, opacity 0.2s;
  transition: all 0.3s;
  transform: translate(0, 100%);
}
.details.show {
  display: initial;
  opacity: 1;
  transform: translate(0, 0);
  backdrop-filter: blur(2px);
  backdrop-filter: blur(5px) grayscale(50%);
}
.details .content {
  margin: auto;
}
.details .content:deep(.details) {
  font-size: 1.2rem !important;
}
.details .content {
  display: grid;
  justify-content: center;
  align-content: center;
  max-width: 920px;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
}
@media (min-width: 640px) {
  .details .content {
    height: 100%;
  }
  .details .content .img {
    max-width: 480px;
    align-self: center;
  }
  .details .content .details {
    grid-column: 2;
  }
  .details .content .img  {
    grid-column: 1;
    grid-row: span 5;
  }
}
@media (max-width: 640px) {
  .details {
    position: absolute;
    inset: 6rem 0 4rem 0;
    display: initial;
    overflow: auto;
  }
  .details .content  {
    grid-template-columns: 1fr;
  }
  .details .content:deep(.img) {
    max-width: 280px;
    margin: auto;
  }
  .details .content:deep(.details) {
    text-align: center;
  }
  .details .content:deep(.details .prices), .details .content:deep(.details .tags){
    justify-content: center;
  }
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
.card-view {
  height: 100%;
  overflow: auto;
}
@media (max-width: 640px) {
  .info-bar {
    display: none;
  }
  .card-view {
    position: absolute;
    inset: 6rem 0 4rem 0;
    overflow: auto;
    height: auto;
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
