<script setup>
import Prices from './Prices.vue';

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  actions: {
    type: Array,
    default: () => ['clip', 'delete', 'prints']
  }
});
const emit = defineEmits(['clip', 'viewPrints', 'delete']);

const markings = {
  'nonfoil': '',
  'etched': '#',
  'foil': '☆'
};
</script>

<template>
  <div
    class="card"
    :class="props.card.finish"
  >
    <div class="img">
      <!-- <img
          v-if="props.card.image_uris"
          :src="`${props.card.image_uris.normal}`"
          loading="lazy"
        > -->
      <img
        v-if="props.card.image_uris"
        :srcset="`${props.card.image_uris.normal}, ${props.card.image_uris.large} 2x, ${props.card.image_uris.large} 400w`"
        loading="lazy"
      >
      <img
        class="flip front"
        v-if="props.card.card_faces && props.card.card_faces[0].image_uris"
        :src="props.card.card_faces[0].image_uris.normal"
        loading="lazy"
      >
      <img
        class="flip back"
        v-if="props.card.card_faces && props.card.card_faces[0].image_uris"
        :src="props.card.card_faces[1].image_uris.normal"
        loading="lazy"
      >
      <div class="buttons">
        <button
          v-if="props.actions.includes('prints')"
          class="small prints icon icon-prints"
          @click.stop="emit('viewPrints', props.card.name);"
          title="View all prints"
        />
        <button
          class="small clip icon icon-add"
          @click.stop="emit('clip', card)"
          title="Add to clipboard"
        />
        <button
          class="small clip icon icon-delete"
          @click.stop="emit('delete', card)"
          title="Delete"
        />
      </div>
    </div>
    <p class="name">
      {{ props.card.count }} {{ props.card.name }} {{ props.card.finish === 'foil' ? '☆' : '' }} {{ props.card.finish === 'etched' ? '#' : '' }}
    </p>
    <p>
      {{ props.card.set_name }}
      <a
        v-if="props.card.purchase_uris"
        :href="props.card.purchase_uris.cardmarket"
        target="_blank"
        class="set-id"
      >{{ props.card.set }}:{{ props.card.collector_number }}</a>
    </p>
    <!-- <p class="price">
        <span>{{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(props.card.price) }}</span>
        <a
          v-if="props.card.purchase_uris"
          :href="props.card.purchase_uris.cardmarket"
          target="_blank"
          class="set"
        >{{ props.card.set }}:{{ props.card.collector_number }}</a>
      </p> -->
    <p>
      <Prices :card="props.card" />
    </p>
    <div class="tags">
      <div 
        class="tag" 
        v-for="tag in props.card.tags"
        :key="tag"
      >
        {{ tag }}
      </div>
    </div>
    <!-- <p>{{ props.card.id }}</p> -->
    <!-- <p>{{ props.card.finish }}</p> -->
    <!-- <p>{{ props.card.finishes }}</p> -->
    <!-- <p>{{ props.card.frame_effects }}</p> -->
    <!-- <p>{{ props.card.prices }}</p> -->
    <!-- <p>{{ props.card.collections }}</p> -->
    <!-- <p>{{ props.card.type }}</p> -->
    <!-- <p>{{ props.card.foil }}</p> -->
    <!-- <p>{{ props.card.frame }}</p> -->
    <!-- <p>{{ props.card.full_art }}</p> -->
    <!-- <p>{{ props.card.border_color }}</p> -->
    <!-- <p>{{ props.card.promo }}</p> -->
    <!-- <p>{{ props.card.reprint }}</p> -->
    <!-- <p>{{ props.card.variation }}</p> -->
    <!-- <p>{{ props.card.prices }}</p> -->
    <!-- <p>{{ props.card.prices.eur }}</p> -->
    <!-- <p>{{ props.card.rarity }}</p> -->
    <!-- {{ card }} -->
  </div>
</template>

<style scoped>
.flip.back {
  display: none;
}
.img {
  position: relative;
}
.img:hover .flip.front {
  display: none;
}
.img:hover .flip.back {
  display: initial;
}
.img .buttons {
  display: none;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  flex-direction: column;
  gap: .5rem;
  z-index: 1;
}
.img:hover .buttons {
  display: flex;
}
p {
  font-size: .9em;
  text-indent: .5rem;
}
.name {
  font-weight: bold;
  display: block;
  font-size: 1em;
  font-family: "Beleren Bold";
  line-height: 1;
  /* font-weight: 600; */
}
.tags {
  display: flex;
  gap: .5rem;
}
.tags .tag {
  font-size: .8rem;
  background-color: var(--colour-accent);
  color: #111;
  padding: .2rem .5rem;
  border-radius: 50px;
}
.set-id {
  color: #827684;
}
img {
  width: 100%;
  border-radius: 5%;
}
.img {
  box-shadow: 0px 2px 5px #000000f2;
  border-radius: 5%;
}
.img::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  bottom: 5px;
  left: 0;
  right: 0;
  pointer-events: none;
  border-radius: 5%;
}
.card.foil .img::after {
  background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.25) 25%, rgba(255,255,0,0.3) 50%, rgba(255,0,0,0.15) 75%, rgba(255,0,0,0.3) 100%);
}
.card.etched .img::after {
  background: linear-gradient(115deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
  opacity: .15;
  mix-blend-mode: hard-light;
}
@supports (mix-blend-mode: multiply) {
  /* .card.foil .img::after {
    background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.9) 25%, rgba(255,255,0,0.9) 50%, rgba(255,0,0,0.9) 75%, rgba(255,0,0,0.9) 100%);
    mix-blend-mode: multiply;
    opacity: .5;
  }
  .card.foil .img::after {
    background: repeating-linear-gradient(170deg, #185494 0%, #EE1D23 10%, #FAAF18 20%, #AEE2A0 30%, #185494 40%);
    opacity: .4;
    mix-blend-mode: multiply;
  } */
  .card.foil .img::after {
    background: repeating-linear-gradient(170deg, #b6d9ff 0%, #FFD4D5 10%, #FFDC96 20%, #DCFFD3 30%, #b5d8ff 40%);
    opacity: 1;
    mix-blend-mode: multiply;
  }
}
/* @supports (mix-blend-mode: soft-light) {
  .card.foil .img::after {
    background: linear-gradient(115deg, rgba(0,255,0) 0%, rgba(0,255,0) 25%, rgba(255,255,0) 50%, rgba(255,0,0) 75%, rgba(255,0,0) 100%);
    opacity: .4;
    background:linear-gradient(120deg, #185494, #EE1D23, #FAAF18, #FFFFFF);
    opacity: .6;
    mix-blend-mode: soft-light;
  }
} */

@media (max-width: 640px) {
  .card {
    scroll-snap-align: start;
  }
  img {
    /* aspect-ratio: .72; */
  }
  .buttons {
    display: flex !important;
  }
}
</style>