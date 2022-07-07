<script setup>
  import { reactive, watchEffect } from 'vue';
  import Prices from './Prices.vue';
  import ManaCost from './ManaCost.vue';
import { useDetails } from '../stores/details';

  const props = defineProps({
    cards: {
      type: Array,
      required: true,
    }, 
    loading: Boolean,
    view: {
      type: String,
      default: 'list'
    },
    actions: {
      type: Array,
      default: () => ['clip', 'delete', 'prints']
    }
  });
  const emit = defineEmits(['clip', 'viewPrints', 'delete']);
  
  const superTypes = ['Commander', 'Planeswalker', 'Legendary Creature', 'Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Token'];

  const ui = reactive({groups: new Map()});
  const details = useDetails();

  watchEffect(() => {
    const groups = new Map();
    for(const t of superTypes) {
      groups.set(t, []);
    }
    for(const card of props.cards.slice(0, 200)) {
      if(card.isCommander) {
        groups.set('Commander', [card]);
        continue;
      }
      // if(!groups.has(card.type)) {
      //   groups.set(card.type, []);
      // }
      let x = groups.get(card.type);
      x.push(card);
    }
    ui.groups = groups;
  });

  const markings = {
    'nonfoil': '',
    'etched': '#',
    'foil': '☆'
  };

</script>

<template>
  <div class="scroll">
    <div class="groups">
      <div
        class="group" 
        v-for="[group, cards] in ui.groups.entries()"
        :key="group"
      >
        <h3>{{ group }}</h3>
        <div class="cards">
          <div
            class="card"
            :class="card.finish"
            v-for="card in cards"
            :key="card.id + card.finish"
            @mouseover="details.loadDetails(card)"
          >
            <div class="name">
              {{ card.finish === 'foil' ? '☆' : '' }} {{ card.finish === 'etched' ? '#' : '' }} {{ card.count }} {{ card.name }}
            </div>
            <div
              class="mana"
              v-if="card.mana_cost"
            >
              <!-- {{ card.mana_cost }} -->
              <ManaCost :mana="card.mana_cost" />
            </div>
            <div class="price">
              <Prices
                :card="card"
                :all="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll {
  position: absolute;
  inset: 3rem 0 0 0;
  overflow: auto;
}
.groups {
  padding: 2rem;
  /* position: absolute; */
  /* inset: 3rem 0 0 0; */
  /* overflow: auto; */
  width: 100%;
  /* column-fill: auto; */
  column-gap: 2rem;
  /* column-width: 25rem; */
  column-count: 1;
}
@media (min-width: 480px) {
  .groups {
    column-count: 1;
  }
}
@media (min-width: 1280px) {
  .groups {
    column-count: 2;
  }
}
@media (min-width: 1600px) {
  .groups {
    column-count: 3;
  }
}
@media (min-width: 2200px) {
  .groups {
    column-count: 4;
  }
}
.group {
  margin-bottom: 1rem;
  break-inside: avoid;
}
.card {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  line-height: 2;
  gap: 1rem;
  border-bottom: 1px dashed rgba(255,255,255,0.1);
}
.name {
  flex-grow: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>