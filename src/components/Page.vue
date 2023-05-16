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
  showMenu: false,
  dragging: false,
  dragY: 0,
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


const init = async () => {
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
};

await init();

let startX = null;
let startY = null;
let lastY = null;
let direction = null;
let initDir = null;
let startedAtTop = false;
let startT = null;

const det = ref(null);

const touchStart = (e) => {
  ui.dragging = true;
  startX = e.touches ? e.touches[0].clientX : e.clientX;
  startY = e.touches ? e.touches[0].clientY : e.clientY;
  startedAtTop = det.value.scrollTop === 0;
  lastY = startY;
  startT = Date.now();
};

const touchMove = e => {
  if(!ui.dragging) return;
  let newX = e.touches ? e.touches[0].clientX : e.clientX;
  let newY = e.touches ? e.touches[0].clientY : e.clientY;
  const deltaX = newX - startX;
  const deltaY = newY - startY;

  let volY = (newY - lastY) / (Date.now() - startT);
  startT = Date.now();
  lastY = newY;

  if(Math.abs(deltaX) > Math.abs(deltaY)) {
    direction = deltaX > 0 ? 'right' : 'left';
  }
  else {
    direction = deltaY > 0 ? 'down' : 'up';
  }
  if(initDir === null) {
    initDir = direction;
  }

  if(initDir === 'left' || initDir === 'right') {
    e.preventDefault();
    e.stopPropagation();
    if(initDir === 'left' && deltaX < -50) {
      moveCard(1);
      ui.dragging = false;
    }
    else if(initDir === 'right' && deltaX > 50) {
      moveCard(-1);
      ui.dragging = false;
    }
    return;
  }
  
  if(!startedAtTop || direction === 'up') return;
  
  if(volY >= 1.2 || deltaY > 200) {
    uiGlobal.details.show = false;
    det.value.style.transform = '';
    ui.dragging = false;
  }
  else if(deltaY > 0) {
    ui.dragY = deltaY;
    e.preventDefault();
    e.stopPropagation();
    det.value.style.transform = `translate(0, ${deltaY}px)`;
  }
};

const touchEnd = e => {
  startX = startY = null;
  det.value.style.transform = '';
  ui.dragging = false;
  initDir = null;
  lastY = null;
  startT = null;
};


const cardsWindow = ref(null);
const moveCard = dir => {
  let newIndex = uiGlobal.details.index + dir;
  if(newIndex < 0) newIndex = cards.filtered.length - 1;
  if(newIndex >= cards.filtered.length) newIndex = 0;
  uiGlobal.details.index = newIndex;
  const next = cards.filtered[uiGlobal.details.index];
  details.loadDetails(next);

  
  if(cardsWindow.value) {
    let scrollable = cardsWindow.value.querySelector('.cards');
    const focused = scrollable.querySelector(`.card[data-id="${next.id}"]`);
    if(focused) {
      // const scrollTo = focused.offsetTop;
      const scrollTo = focused.offsetTop - (scrollable.offsetHeight / 2) + (focused.offsetHeight / 2);
      scrollable.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
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
      <!-- <InfoBar /> -->
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
          show: uiGlobal.details.show,
          dragging: ui.dragging,
        }"
        :style="{
          // transform: ui.dragging ? `translate(0, ${ui.dragY}px)` : false
        }"
        @touchstart="touchStart"
        @touchmove="touchMove"
        @touchend="touchEnd"
        @wheel="() => {}"
        @click="clickOut"
      >
        <a
          class="move-card icon icon-chevron-left"
          @click="moveCard(-1)"
        />
        <div class="content">
          <CardImage
            :card="details.card" 
            @click.stop=""
          />
          <div class="right">
            <CardDetails
              :card="details.card"
            />
            <a
              class="close icon icon-chevron-down"
              @click="uiGlobal.details.show = false"
            />
          </div>
        </div>
        <a
          class="move-card icon icon-chevron-right"
          @click="moveCard(1)"
        />
      </div>

      <div
      
        ref="cardsWindow"
        class="card-view"
        @click="uiGlobal.sidebar.show = false"
      >
        <InfoBar />
        <CardView
          :store="cards"
          v-if="uiGlobal.mainView === 'cards'"
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
  /* opacity: 0; */
  padding: 1rem;
  transition: transform 0.2s, opacity 0.2s;
  transition: all 0.3s;
  transform: translate(0, 100%);
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3;
}
.details.dragging {
  transition: none;
}
.details.show {
  opacity: 1;
  transform: translate(0, 0);
  backdrop-filter: blur(2px);
  backdrop-filter: blur(5px) grayscale(50%);
}
.details .content {
  display: flex;
  justify-content: center;
  align-content: center;
  max-width: 920px;
  gap: 1rem;
}
.details a:is(.move-card, .close) {
  font-size: 5rem;
  cursor: pointer;
}
.details .content:deep(.details) {
  font-size: 1.2rem !important;
}

.details .content .right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.details .close {
  display: none;
}

@media (min-width: 640px) {
  .details {
    top: 3rem;
    gap: 5rem;
  }
  .details a.close {
    display: block;
    flex-basis: 100%;
    justify-self: flex-start;
    align-self: center;
  }
  .details .content {
    row-gap: 1rem;
    flex-grow: 1;
  }
  .details .content .img {
    max-width: 480px;
  }
  .details .content .right {
    width: 50%;
  }
  .details .content:deep(.details) {
    order: -2;
  }
  .details .content:deep(.buttons) {
    position: relative;
    flex-direction: row;
    justify-content: center;
    order: -1;
  }
}

@media (max-width: 640px) {
  .details {
    display: block;
    position: absolute;
    inset: 6rem 0 4rem 0;
  }
  .details .move-card {
    display: none;
  }
  .details .content  {
    flex-direction: column;
  }
  .details .content .right {
    gap: 1rem;
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
  position: absolute;
  inset: 0;
}
@media (max-width: 1280px) {
  .info-bar {
    /* display: none; */
  }
  .card-view {
    position: absolute;
    inset: 6rem 0 0 0;
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
@media (max-width: 640px) {
  .card-view {
    inset: 6rem 0 4rem 0;
  }
}
</style>
