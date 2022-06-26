<script setup>
  import Card from './Card.vue';

  const props = defineProps({
    cards: Array, 
    zoom: Number, 
    loading: Boolean,
    actions: {
      type: Array,
      default: () => ['clip', 'delete', 'prints']
    }
  });
  const emit = defineEmits(['clip', 'viewPrints', 'delete']);

</script>

<template>
  <div
    class="loader"
    v-if="props.loading"
  >
    Loading
  </div>
  <div
    class="cards"
    :style="{ 'font-size': 18 + (props.zoom * 2) + 'px' }"
  >
    <div
      class="fix"
      v-for="card in props.cards.slice(0, 500)"
      :key="card.id + card.finish"
      :style="{order: card.isCommander ? -1 : null}"
    >
      <Card 
        :card="card"
        @clip="(...args) => $emit('clip', ...args)"
        @view-prints="(...args) => $emit('viewPrints', ...args)"
        @delete="(...args) => $emit('delete', ...args)"
      />
    </div>
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
  position: absolute;
  inset: 3rem 0 0 0;
  overflow: auto;
}
.fix {

}
.cards .card {
  margin: 0 auto;
  min-width: 15em;
	content-visibility: auto;
  max-width: 20rem;
}


@media (max-width: 640px) {
  #main .cards {
    padding: 0 10vw;

  }
  .cards {
    justify-content: center;
	  scroll-snap-type: y mandatory;
  }
}
</style>