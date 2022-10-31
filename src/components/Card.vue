<script setup>
import { useDetails } from '../stores/details';
import CardImage from './CardImage.vue';
import CardSummary from './CardSummary.vue';
import CardActions from './CardActions.vue';
import { useUI } from '../stores/ui';
import { useCardView } from '../stores/cards';

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
    :data-id="props.card.id"
  >
    <div class="wrap">
      <CardImage 
        :card="props.card"
        :effects="cardView.filters.cmpCol.length > 0 && !cardView.have.get(props.card.oracle_id) ? ['missing'] : []"
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
  margin-bottom: 1em;
}
.wrap:hover:deep(.buttons) {
  display: flex;
}

.card {
  width: 100%;
}
@media (min-width: 640px) {
  .wrap:deep(.buttons) {
    display: none;
  }
}
@media (max-width: 640px) {
  .card {
    /* scroll-snap-align: start; */
  }
}
</style>