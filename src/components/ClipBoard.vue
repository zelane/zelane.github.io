<script setup>
import CardExporter from './CardExporter.vue';
import MenuButton from './MenuButton.vue';
import { useCollections } from '../stores/collections';
import { deepUnref } from 'vue-deepunref';
import { useToast } from "vue-toastification";
import { useCardView, useClipboard } from '../stores/cards';

const clipboard = useClipboard();
const collections = useCollections();
const cards = useCardView();
const toast = useToast();

const addToCollection = async (name, newCards) => {
  let collection = await collections.get(name);

  for(const newCard of newCards) {
    let existing = collection.cards.filter(card => card.id === newCard.id);
    if(existing.length === 0) {
      collection.cards.push({... deepUnref(newCard)});
    }
    else {
      existing[0].count += newCard.count || 1;
    }
  }
  await collections.save(name, collection.cards, collection.syncCode);
  toast(`${newCards.length} added to ${name}`);
};

</script>

<template>
  <div
    class="clipboard"
  >
    <h3>Clipboard ({{ clipboard.count }}) {{ clipboard.value }}</h3>
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
      <CardExporter :cards="clipboard.cards" />
      
      <MenuButton 
        text="Add to collection"
        :actions="Object.fromEntries(collections.all.map(col => [col, col]))"
        @click="col => addToCollection(col, clipboard.cards.values())"
      />

      <button @click="clipboard.addMany(cards.filtered, true)">
        Clip All
      </button>
      <button @click="clipboard.$reset()">
        Clear
      </button>
    </div>
  </div>
</template>

<style scoped>
.clipboard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
</style>