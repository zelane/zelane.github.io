<script setup>
import Prices from './Prices.vue';
const props = defineProps({
  card: {
    type: Object,
    required: true
  }
});


const markings = {
  'nonfoil': '',
  'etched': '#',
  'foile': '☆'
};
</script>

<template>
  <div class="details">
    <span class="name">
      {{ props.card.count }} {{ props.card.name }} {{ markings[props.card.finish] }}
    </span>
    <span>
      {{ props.card.set_name }}
      <a
        v-if="props.card.purchase_uris"
        :href="props.card.purchase_uris.cardmarket"
        target="_blank"
        class="set-id"
      >{{ props.card.set }}:{{ props.card.collector_number }}</a>
    </span>
    <span>
      <Prices :card="props.card" />
    </span>
    <div class="tags">
      <div 
        class="tag" 
        v-for="tag in props.card.tags"
        :key="tag"
      >
        {{ tag }}
      </div>
      <template 
        v-if="props.card.promo_types"
      >
        <div
          class="tag"
          v-for="tag in props.card.promo_types.filter(card => {
            return card !== 'boosterfun';
          })"
          :key="tag"
        >
          {{ tag }}
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.details {
  font-size: 1rem;
  font-size: 1em;
  line-height: 1.6;
}
.name {
  font-weight: bold;
  display: block;
  font-size: 1em;
  font-family: "Beleren Bold";
}
.tags {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
  line-height: 1;
  margin-top: .5em;
}
.tags .tag {
  font-size: .8em;
  background-color: var(--colour-accent);
  color: #111;
  padding: .2rem .5rem;
  border-radius: 50px;
  text-indent: 0;
}
.set-id {
  color: #827684;
}
</style>