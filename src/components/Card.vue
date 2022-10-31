<script setup>
import { useCardView } from '../stores/cards';
import { useDetails } from '../stores/details';
import CardImage from './CardImage.vue';
import CardSummary from './CardSummary.vue';
import CardActions from './CardActions.vue';
import { useUI } from '../stores/ui';

const cardView = useCardView();
const details = useDetails();
const ui = useUI();

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0,
  },
  actions: {
    type: Array,
    default: () => ['clip', 'delete', 'prints']
  }
});

</script>

<template>
  <div
    class="card"
    :style="{
      opacity: cardView.filters.cmpCol.length === 0 || cardView.have.get(card.oracle_id) ? 1 : 0.5
    }"
    :data-id="props.card.id"
  >
    <div class="wrap">
      <CardImage 
        :card="props.card"
        @click.stop="() => {details.loadDetails(card, includeRulings=true); ui.details.show = true; ui.details.index = index}"
      />
      <CardActions
        :card="props.card"
        :actions="props.actions"
      />
    </div>
    <CardSummary :card="props.card" />
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  margin-bottom: 1rem;
}
.wrap:hover:deep(.buttons) {
  display: flex;
}

.card {
  width: 100%;
}

@media (max-width: 640px) {
  .card {
    /* scroll-snap-align: start; */
  }
}
</style>