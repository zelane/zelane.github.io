<script setup>
import { reactive, computed } from 'vue';
import CardExporter from './CardExporter.vue';
import MenuButton from './MenuButton.vue';
import { useClipboard } from '../stores/clipboard';

const clipboard = useClipboard();

const props = defineProps({
  cards: {
    type: Array,
    required: true,
  },
  collections: {
    type: Array,
    required: true,
  },

});

const emit = defineEmits(['addToSet']);

</script>

<template>
  <div
    class="clipboard"
  >
    <h3>Clipboard ({{ clipboard.count }}) {{ clipboard.price }}</h3>
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
        text="Add to set"
        :actions="Object.fromEntries(props.collections.map(col => [col, col]))"
        @click="col => addToSet(col, clipboard.cards.values())"
      />

      <button @click="clipboard.addMany(props.cards, true)">
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