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
  const isOpen = collections.open.includes(name);
  let added = 0;
  for(const newCard of newCards) {
    let existing = collection.cards.filter(card => card.id === newCard.id);
    if(existing.length === 0) {
      collection.cards.push({... deepUnref(newCard)});
    }
    else {
      existing[0].count += newCard.count || 1;
    }
    added += 1;
    if(isOpen) {
      cards.add({... newCard});
    }
  }
  await collections.save(name, collection.cards, collection.syncCode);
  toast(`${added} added to ${name}`);
};

const clear = async () => {
  clipboard.$reset();
  await collections.save('clipboard', []);
  const channel = new BroadcastChannel("clipboard");
  channel.postMessage('update');
};

const clipAll = async() => {  
  // clipboard.addMany(cards.filtered);
  cards.filtered.forEach(card => {
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
    class="clipboard"
  >
    <h3>Clipboard ({{ clipboard.count }}) {{ clipboard.value }}</h3>
    <div class="clip-cards">
      <div
        class="clip-card"
        v-for="card in clipboard.cards.values()"
        :key="'clip-' + card.name"
      >
        <p>{{ card.count }}x {{ card.name }} ({{ card.set }}) {{ card.collector_number }}</p> 
      </div>
    </div>
    <div class="buttons">
      <CardExporter :cards="[... clipboard.cards.values()]" />
      
      <MenuButton 
        text="Add to"
        :actions="Object.fromEntries(collections.names.map(col => [col, col]))"
        @click="col => addToCollection(col, clipboard.cards.values())"
      />

      <button @click="clipAll()">
        Clip All
      </button>
      <button @click="clear()">
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