<script setup>
import PrintsView from './PrintsView.vue';
import CardDetails from './CardDetails.vue';
import CardParser from './CardParser.vue';
import CardExporter from './CardExporter.vue';
import ClipBoard from './ClipBoard.vue';
import { useUI } from '../stores/ui';
import { useCardView } from '../stores/cards';


const cards = useCardView();
const ui = useUI();

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

</script>

<template>
  <div
    class="sidepanel"
    :class="{'show': ui.sidebar.show}"
  >
    <div
      class="menu"
    >
      <div
        class="item" 
        @click.stop="setMenu(name)"
        v-for="(icon, name) in {
          'collection': 'collection-add2', 
          'clipboard':'clipboard', 
          'prints': 'prints', 
          'details': 'details', 
          'settings': 'settings'
        }"
        :key="name"
        :class="name"
      >
        <span
          class="icon"
          :class="'icon-' + icon"
        />
      </div>
    </div>

    <div
      class="add panel"
      v-show="ui.sidebar.selected === 'collection'"
    >
      <span>
        <CardParser
          @parsed="cards.loadCollections"
        />
        <CardExporter :cards="cards.filtered" />
      </span>
    </div>

    <div
      class="settings panel"
      v-show="ui.sidebar.selected === 'settings'"
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
      class="details panel"
      v-show="ui.sidebar.selected === 'details'"
    >
      <h3>Details</h3>
      <CardDetails />
    </div>
        
    <div
      class="prints panel"
      v-show="ui.sidebar.selected === 'prints'"
    >
      <PrintsView />
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
.sidepanel .panel {
  position: absolute;
  inset: 0;
  padding: 1rem 2rem;
  overflow: auto;
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
</style>