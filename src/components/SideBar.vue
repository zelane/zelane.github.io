<script setup lang="ts">
import { ref } from 'vue';
import PrintsView from './PrintsView.vue';
import VersionView from './VersionsView.vue';
import CardDetails from './CardDetails.vue';
import CardParser from './CardParser.vue';
import ClipBoard from './ClipBoard.vue';
import Filters from './Filters.vue';
import { useUI } from '../stores/ui';
import { useCardView, useClipboard } from '../stores/cards';
import CollectionsManager from './CollectionsManager.vue';
import { useDetails } from '../stores/details';
import CardImage from './CardImage.vue';
import Settings from './SettingsView.vue';
import CardEdit from './CardEdit.vue';

const details = useDetails();
const cards = useCardView();
const ui = useUI();
const clipboard = useClipboard();

const setMenu = item => {
  if(item === ui.sidebar.selected) ui.sidebar.show = !ui.sidebar.show;
  else {
    ui.sidebar.show = true;
    ui.sidebar.selected = item;
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

let touchXPos = 0;
let touchYPos = 0;
const sidebar = ref(null);

const touchStart = (e) => {
  touchXPos = e.touches ? e.touches[0].clientX : e.clientX;
  touchYPos = e.touches ? e.touches[0].clientY : e.clientY;
};

const touchEnd = (e) => {
  const posX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  const posY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
  const deltaX = posX - touchXPos;
  const deltaY = Math.abs(posY - touchYPos);
  if(ui.sidebar.show === true && deltaX > 75 && deltaX > deltaY) {
    ui.sidebar.show = false;
  }
};

</script>

<template>
  <div
    class="sidepanel"
    :class="{'show': ui.sidebar.show}"
    ref="sidebar"
    @mousedown="touchStart"
    @mouseup="touchEnd"
    @touchstart="touchStart"
    @touchend="touchEnd"
  >
    <div
      class="menu"
    >
      <div
        class="item" 
        @click.stop="setMenu(name)"
        v-for="([icon, text], name) in {
          'filters': ['filter', 'Filter'],
          'clipboard': ['clipboard', 'Clipboard'],
          'collection': [ 'add', 'Add'],
          'collections': [ 'collection','Manage'],
          'prints': [ 'prints', 'Prints'],
          // 'details': [ 'details', 'Card details'],
          'settings': [ 'settings','Settings'],
        }"
        :key="name"
        :class="[name, name === 'clipboard' && ui.clipboard_change ? 'changed' : '']"
      >
        <span
          class="icon"
          :class="'icon-' + icon"
        />
        <div
          v-if="name === 'clipboard'" 
          class="name"
        >
          Clip: {{ clipboard.count }}
        </div>
        <div
          v-else
          class="name"
        >
          {{ text }}
        </div>
      </div>
    </div>

    <div
      class="add panel"
      v-show="ui.sidebar.selected === 'collection'"
    >
      <CardParser
        @parsed="cards.loadCollections"
      />
    </div>

    <div
      class="settings panel"
      v-show="ui.sidebar.selected === 'settings'"
    >
      <Settings />
    </div>
    <div
      class="details panel"
      v-show="ui.sidebar.selected === 'details'"
    >
      <h3>Details</h3>
      <CardImage v-if="details.card" :card="details.card" />
      <CardDetails v-if="details.card" :card="details.card" />
    </div>
        
    <div
      class="prints panel"
      v-show="ui.sidebar.selected === 'prints'"
    >
      <PrintsView />
    </div>
        
    <div
      class="versions panel"
      v-show="ui.sidebar.selected === 'versions'"
    >
      <VersionView />
    </div>

    <div
      class="panel filters"
      v-show="ui.sidebar.selected === 'filters'"
    >
      <Filters />
    </div>

    <div
      class="panel edit"
      v-show="ui.sidebar.selected === 'edit'"
    >
      <h3>Edit</h3>
      <CardEdit />
    </div>

    <div
      class="panel collections"
      v-show="ui.sidebar.selected === 'collections'"
    >
      <h3>Collections</h3>
      <CollectionsManager
        @change="name => cards.loadCollections([name])"
      />
    </div>

    <!-- <div
          class="info"
          v-if="ui.sidebar.selected === 'info'"
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
    <div
      class="panel" 
      v-show="ui.sidebar.selected === 'clipboard'"
    >
      <ClipBoard />
    </div>
  </div>
</template>

<style scoped>
.menu {
  /* display: none; */
  position: absolute !important;
  left: 0;
  bottom: 50px;
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
  font-size: 1.2em;
}
.menu .item .name {
  display: none;
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
  z-index: 4;
  color: var(--colour-light-font);
}
.sidepanel.show {
  transform: translate(0, 0);
}
.panel {
  position: absolute;
  inset: 0;
  padding: 1rem 2rem;
  overflow: auto;
}
.panel h3 {
  margin-bottom: 1rem;
}
.info {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.info .sets {
  overflow: auto;
  line-height: 1.8;
  flex-grow: 1;
  padding: 1rem 1rem;
}
.panel.prints:deep(.cards) {
  grid-template-columns: auto !important;
  padding: 0;
  max-width: 280px;
  margin: auto;
}
.panel.prints:deep(.details .name) {
  display: none !important;
}
.card {
  min-width: 100%;
}
.buttons {
  display: grid;
  gap: .5rem;
}
.panel.filters {
  text-align: left;
  padding: 40px 20px;
  background-color: var(--colour-sidebar);
  gap: 1.5rem 0;
  display: flex;
  flex-direction: column;
}
.item.filters {
  display: none;
}
@media (max-width: 1280px) {
  
  .item.filters {
    display: initial;
  }
  .sidepanel {
    top: 6rem;
  }
}
@media (max-width: 640px) {
  .menu {
    width: 100vw;
    flex-direction: row-reverse;
    bottom: 0px;
    gap: 5px;
    padding: 1rem;
    background: var(--colour-lighter-grey);
  }
  .menu .item {
    flex-grow: 1;
    width: 20%;
    border-radius: 0;
    box-shadow: none;
    background: none;
    text-align: center;
    padding: 0;
  }
  .menu .item .name{
    display: block;
    font-size: .6rem;
    margin-top: .5rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .menu .item .icon {
    color: var(--colour-anchor);
  }

  .item.prints, .item.details {
    display: none;
  }
  .sidepanel {
    width: 100vw;
    max-width: 100vw;
    top: 0;
  }
  .sidepanel.show {
    transform: translate(0, 0);
    z-index: 5;
  }
  .sidepanel .panel {
    top: 1rem;
  }
}
.menu .item.clipboard .icon {
  /* display: block; */
  /* animation: bounce 1s infinite; */
}
.menu .item.clipboard.changed .icon {
  display: block;
  animation: bounce .5s forwards;
}

@keyframes bounce {
    0%   { transform: scale(1,1)      translateY(0); }
    10%  { transform: scale(1.1,.9)   translateY(0); }
    30%  { transform: scale(.9,1.1)   translateY(-6px); }
    50%  { transform: scale(1.05,.95) translateY(0); }
    57%  { transform: scale(1,1)      translateY(-2px); }
    64%  { transform: scale(1,1)      translateY(0); }
    100% { transform: scale(1,1)      translateY(0); }
}

@keyframes bounce {
    0%   { transform: rotate(0deg)    translateY(0); }
    10%  { transform: rotate(0deg)    translateY(0); }
    20%  { transform: rotate(10deg)   translateY(-2px); }
    30%  { transform: rotate(0deg)    translateY(-3px); }
    40%  { transform: rotate(-10deg)  translateY(-4px); }
    50%  { transform: rotate(0deg)    translateY(0); }
    57%  { transform: rotate(0deg)    translateY(-2px); }
    64%  { transform: rotate(0deg)    translateY(0); }
    100% { transform: rotate(0deg)    translateY(0); }
}
/* 
@keyframes bounce {
    0%   { transform: rotate(0deg)    translateY(0); }
    10%  { transform: rotate(0deg)    translateY(0); }
    30%  { transform: rotate(0deg)    translateY(-5px); }
    35%  { transform: rotate(10deg)   translateY(-5px); }
    40%  { transform: rotate(-10deg)   translateY(-5px); }
    45%  { transform: rotate(10deg)   translateY(-5px); }
    50%  { transform: rotate(-10deg)   translateY(-5px); }
    60%  { transform: rotate(0deg)    translateY(0); }
    67%  { transform: rotate(0deg)    translateY(-2px); }
    74%  { transform: rotate(0deg)    translateY(0); }
    100% { transform: rotate(0deg)    translateY(0); }
} */
</style>