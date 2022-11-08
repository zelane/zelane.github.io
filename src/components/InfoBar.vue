<script setup>
import Multiselect from '@vueform/multiselect';

import { useCardView, useClipboard } from '../stores/cards';
import { useCollections } from '../stores/collections';
import { useUI } from '../stores/ui';

const cards = useCardView();
const ui = useUI();
const collections = useCollections();
const clipboard = useClipboard();

const deleteSelection = async () => { // Expects set
  if(confirm(`Are you sure you want to delete ${[... cards.selected].length} cards from ${collections.open.join(', ')}`)) {
    let selected = cards.getSelection();
    for(const card of selected) {
      await collections.deleteCard(collections.open, card);
        // Replace cards with filtered cards instead, stops jumping
      cards.delete(card);
    }
    cards.selected = new Set();
  };
};

const clipSelection = async() => {  
  let selected = cards.getSelection();
  selected.forEach(card => {
    let copy = {... card};
    copy.count = 1;
    clipboard.add(copy);
  });
  await collections.save('clipboard', clipboard.unrefCards());
  const channel = new BroadcastChannel("clipboard");
  channel.postMessage('update');
};

</script>

<template>
  <div
    class="info-bar"
    v-if="ui.mainView === 'cards' || ui.mainView === 'list'"
  >
    <template v-if="[... cards.selected].length === 0 ">
      <span>Count {{ cards.count }}</span>
      <span>Value {{ cards.value }}</span>

      <span class="sort">
        <Multiselect
          v-model="cards.sort.val"
          :options="['Mana', 'Type', 'Price', 'Count', 'Released', 'Tag', 'Number']"
          mode="single"
          :can-clear="false"
        />
        <div class="dir">
          <div
            class="up icon icon-chevron-up"
            :class="{selected: cards.sort.dir == -1}"
            @click="cards.sort.dir = -1"
          />
          <div
            class="up icon icon-chevron-down"
            @click="cards.sort.dir = 1"
            :class="{selected: cards.sort.dir == 1}"
          />
        </div>
      </span>

      <span class="view">
        <span
          class="cardView icon icon-grid"
          @click="ui.mainView = 'cards'"
          :class="{selected: ui.mainView === 'cards'}"
        />
        <span
          class="cardView icon icon-list"
          @click="ui.mainView = 'list'"
          :class="{selected: ui.mainView === 'list'}"
        />
      </span>
    </template>
    <template
      v-else
    >
      <span>Selected: {{ [... cards.selected].length }}</span>
      <div
        class="selection-menu"
        v-if="[... cards.selected].length > 0"
      >
        <a @click="() => {cards.selected = new Set()}">Clear</a>
        <a @click="clipSelection">Clip</a>
        <!-- <a @click="() => {}">Move</a> -->
        <a @click="deleteSelection">Delete</a>
      </div>
    </template>
  </div>
</template>

<style scoped>
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
.sort .dir .icon{
  cursor: pointer;
}
.sort .dir .icon.selected {
  color: var(--colour-anchor);
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
  display: none;
  letter-spacing: .5rem;
}
.info-bar .view .cardView {
  cursor: pointer;
}
.info-bar .view .cardView.selected {
  color: var(--colour-anchor);
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
.selection-menu {
  display: flex;
  gap: .5em;
}
.selection-menu a {
  cursor: pointer;
}
@media (max-width: 640px) {
  .info-bar {
    justify-content: space-evenly;
    gap: 0;
  }
}
</style>