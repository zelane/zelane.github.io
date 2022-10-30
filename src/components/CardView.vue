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
    Loading
  </div>
  <div
    class="cards"
    :style="{ 'font-size': 18 + (ui.zoom * 2) + 'px' }"
  >
    <Card
      :card="card"
      :actions="props.actions"
      v-for="card in props.store.filtered.slice(0, 500)"
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
  line-height: 100vh;
  text-align: center;
  font-size: 2rem;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
  gap: 2em;
  padding: 2rem;
  /* inset: 3rem 0 0 0; */
}
.cards .card {
  margin: 0 auto;
  min-width: 15em;
	content-visibility: auto;
  max-width: 20rem;
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