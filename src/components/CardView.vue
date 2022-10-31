<script setup>
import { useUI } from '../stores/ui';
import Card from './Card.vue';

const ui = useUI();

const props = defineProps({
  store: {
    type: Object,
    required: true
  },
  actions: {
    type: Array,
    default: () => ['clip', 'delete', 'details', 'prints']
  }
});

</script>

<template>
  <div
    class="loader"
    v-if="props.store.loading"
  >
    <span>Loading</span>
  </div>
  <div
    class="cards"
    :style="{ 
      'font-size': 18 + (ui.zoom * 2) + 'px',
      'grid-template-columns': `repeat(${ui.columns}, 1fr)`
    }"
  >
    <Card
      :card="card"
      :index="index"
      :actions="props.actions"
      v-for="(card, index) in props.store.filtered.slice(0, 500)"
      :key="card.id + card.finish"
      :style="{order: card.isCommander ? -1 : null}"
    />
  </div>
</template>

<style scoped>

.loader {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 99;
  font-size: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  
  background: linear-gradient(0deg, rgb(23, 19, 23) 0%, rgb(23, 19, 23) 20%, rgba(23, 19, 23, 0.8) 100%);
  backdrop-filter: blur(2px);
  backdrop-filter: blur(5px) grayscale(50%);
}
.cards {
  display: grid;
  gap: 2em;
  padding: 2rem;
}
.cards .card {
  margin: 0 auto;
  min-width: 15em;
	content-visibility: auto;
  max-width: 20rem;
}

@media (min-width: 640px) {
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15em, 1fr)) !important;
  gap: 2em;
  padding: 2rem;
}
}
@media (max-width: 640px) {
  #main .cards {
    padding: 1rem 10vw;
  }
  .cards {
    justify-content: center;
	  /* scroll-snap-type: y mandatory; */
  }
}
</style>