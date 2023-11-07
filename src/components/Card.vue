<script setup>
import CardImage from './CardImage.vue';
import CardSummary from './CardSummary.vue';
import CardActions from './CardActions.vue';
import { useCardView } from '../stores/cards';

const cardView = useCardView();

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0,
  },
  selected: {
    type: Boolean,
    default: false
  },
  actions: {
    type: Array,
    default: () => ['select', 'deselect', 'clip', 'delete', 'prints']
  }
});

const emit = defineEmits(['clicked', 'select', 'deselect']);

const calcEffects = card => {
  if(cardView.filters.cmpCol.length > 0) {
    const have = cardView.have.get(card.oracle_id);
    const haveExact = cardView.haveExact.get(card.id);
    if (haveExact) {
      return ['exact'];
    }
    else if(have) {
      return ['have'];
    }
    return ['missing'];
    // return missing ? ['missing'] : ['selected'];
  }
  if ([... cardView.selected].length > 0) {
    return cardView.selected.has(card.id + card.finish) ? ['selected'] : ['missing'];
  }
};

</script>

<template>
  <div
    class="card"
    :data-id="props.card.id"
    @select="emit('select')"
    @deselect="emit('deselect')"
    :class="{
      selected: props.selected
    }"
  >
    <div class="wrap">
      <CardImage 
        :card="props.card"
        :effects="calcEffects(card)"
        @click.stop="emit('clicked')"
      />
      <CardActions
        :card="props.card"
        :actions="props.selected ? props.actions.concat(['deselect']) : props.actions"
        @select="emit('select')"
        @deselect="emit('deselect')"
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
.card.selected:deep(.img::before) {
  font-family: var(--font-icons);
  content: "\e939";
  position: absolute;
  top: 12%;
  left: 10%;
  color: var(--colour-green);
  text-shadow: 1px 1px 0px black, 1px 0px 0px black, 0px 1px 0px black, 0px 0px 0px black;
  font-size: 2rem;
}
.card:deep(.buttons .select) {
  display: block;
}
.card:deep(.buttons .deselect) {
  display: none;
}
.card.selected:deep(.buttons .select) {
  display: none;
}
.card.selected:deep(.buttons .deselect) {
  display: block;
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