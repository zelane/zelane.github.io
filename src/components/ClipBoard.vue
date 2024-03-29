<script setup lang="ts">
import CardExporter from './CardExporter.vue';
import { useCollections } from '../stores/collections';
import { useToast } from "vue-toastification";
import { useCardView, useClipboard } from '../stores/cards';
import Multiselect from '@vueform/multiselect';
import { reactive } from 'vue';
import { Card } from '../models/Card';

const clipboard = useClipboard();
const collections = useCollections();
const cards = useCardView();
const toast = useToast();

const ui = reactive({
  copyTo: null,
});

const addToCollection = async (name: string) => {
  await collections.addMany(name, clipboard.unrefCards(), 'add');
  if (collections.open.includes(name)) {
    await cards.reloadCollections([name]);
  }
  toast(`${clipboard.filtered.length} added to ${name}`);
};

const clear = async () => {
  clipboard.$reset();
  await collections.empty('clipboard');
  const channel = new BroadcastChannel("clipboard");
  channel.postMessage('update');
};

const clipAll = async() => {  
  cards.filtered.forEach(card => {
    let copy = {... card};
    copy.count = 1;
    clipboard.add(copy);
  });
  await collections.addMany('clipboard', clipboard.unrefCards().map((card: Card) => {
    return {
      id: card.id,
      finish: card.finish || 'nonfoil',
      count: 1,
      data: card.data,
    } as Card
  }), 'add');
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
        :key="'clip-' + card.data.name"
      >
        <p>{{ card.count }}x {{ card.data.name }} ({{ card.data.set }}) {{ card.data.collector_number }}</p> 
      </div>
    </div>
    <CardExporter
      :source="() => [... clipboard.cards.values()]" 
      open-direction="top"
    />
    <div class="row">
      <Multiselect
        :options="collections.names"
        placeholder="Copy to"
        open-direction="top"
        v-model="ui.copyTo"
      />
      <button
        class="small icon icon-arrow-right"
        @click="() => addToCollection(ui.copyTo)"
      />
    </div>
    <div class="buttons">
      <button
        @click="clipAll()"
      >
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
.row {
  display: flex;
  gap: .5rem;
  margin-top: 1rem;
}
</style>