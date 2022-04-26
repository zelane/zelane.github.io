<script setup>

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

  const markings = {
    'nonfoil': '',
    'etched': '#',
    'foil': '☆'
  };

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
      class="card"
      :class="card.finish"
      v-for="card in props.cards.slice(0, 500)"
      :key="card.id + card.finish"
    >
      <div class="img">
        <!-- <img
          v-if="card.image_uris"
          :src="`${card.image_uris.normal}`"
          loading="lazy"
        > -->
        <img
          v-if="card.image_uris"
          :srcset="`${card.image_uris.normal}, ${card.image_uris.large} 2x, ${card.image_uris.large} 400w`"
          loading="lazy"
        >
        <img
          class="flip front"
          v-if="card.card_faces && card.card_faces[0].image_uris"
          :src="card.card_faces[0].image_uris.normal"
          loading="lazy"
        >
        <img
          class="flip back"
          v-if="card.card_faces && card.card_faces[0].image_uris"
          :src="card.card_faces[1].image_uris.normal"
          loading="lazy"
        >
        <div class="buttons">
          <button
            v-if="props.actions.includes('prints')"
            class="small prints icon icon-prints"
            @click.stop="emit('viewPrints', card.name);"
            title="View all prints"
          />
          <button
            class="small clip icon icon-add"
            @click.stop="emit('clip', card)"
            title="Add to clipboard"
          />
          <!-- <button
            class="small clip icon icon-delete"
            @click.stop="emit('delete', card)"
            title="Delete"
          /> -->
        </div>
      </div>
      <p class="name">
        {{ card.count }} {{ card.name }} {{ card.finish === 'foil' ? '☆' : '' }} {{ card.finish === 'etched' ? '#' : '' }}
      </p>
      <p>
        {{ card.set_name }}
        <a
          v-if="card.purchase_uris"
          :href="card.purchase_uris.cardmarket"
          target="_blank"
          class="set-id"
        >{{ card.set }}:{{ card.collector_number }}</a>
      </p>
      <!-- <p class="price">
        <span>{{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.price) }}</span>
        <a
          v-if="card.purchase_uris"
          :href="card.purchase_uris.cardmarket"
          target="_blank"
          class="set"
        >{{ card.set }}:{{ card.collector_number }}</a>
      </p> -->
      <p class="prices">
        <span
          v-for="finish in card.finishes"
          :key="finish"
        >
          <span
            class="price"
            :class="finish === card.finish ? 'match' : ''"
            v-if="finish === 'nonfoil'"
          >
            {{ markings[finish] }} {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.prices['eur'] || (card.prices['usd'] * 0.9)) }}
          </span>
          <span
            class="price"
            :class="finish === card.finish ? 'match' : ''"
            v-else
          >
            {{ markings[finish] }} {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.prices['eur_' + finish] || (card.prices['usd_' + finish] * 0.9)) }}
          </span>
        </span>
      </p>
      <div class="tags">
        <div 
          class="tag" 
          v-for="tag in card.tags"
          :key="tag"
        >
          {{ tag }}
        </div>
      </div>
      <!-- <p>{{ card.finish }}</p> -->
      <!-- <p>{{ card.finishes }}</p> -->
      <!-- <p>{{ card.frame_effects }}</p> -->
      <!-- <p>{{ card.prices }}</p> -->
      <!-- <p>{{ card.collections }}</p> -->
      <!-- <p>{{ card.type }}</p> -->
      <!-- <p>{{ card.foil }}</p> -->
      <!-- <p>{{ card.frame }}</p> -->
      <!-- <p>{{ card.full_art }}</p> -->
      <!-- <p>{{ card.border_color }}</p> -->
      <!-- <p>{{ card.promo }}</p> -->
      <!-- <p>{{ card.reprint }}</p> -->
      <!-- <p>{{ card.variation }}</p> -->
      <!-- <p>{{ card.prices }}</p> -->
      <!-- <p>{{ card.prices.eur }}</p> -->
      <!-- <p>{{ card.rarity }}</p> -->
    </div>
  </div>
</template>

<style scoped>

.loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  top: 3rem;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}
.card {
  min-width: 15em;
	content-visibility: auto;
}
.card .flip.back {
  display: none;
}
.card .img {
  position: relative;
}
.card .img:hover .flip.front {
  display: none;
}
.card .img:hover .flip.back {
  display: initial;
}
.card .img .buttons {
  display: none;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  flex-direction: column;
  gap: .5rem;
  z-index: 1;
}
.card .img:hover .buttons {
  display: flex;
}
.card p {
  font-size: .9em;
  text-indent: .5rem;
}
.card .name {
  font-weight: bold;
  display: block;
  font-size: 1em;
  font-family: "Beleren Bold";
  line-height: 1;
  /* font-weight: 600; */
}
.card .tags {
  display: flex;
  gap: .5rem;
}
.card .tags .tag {
  font-size: .8rem;
  background-color: var(--colour-accent);
  color: #111;
  padding: .2rem .5rem;
  border-radius: 50px;
}
.card .set-id {
  color: #827684;
}
.card img {
  width: 100%;
  border-radius: 5%;
}
.card .img {
  box-shadow: 0px 2px 5px #000000f2;
  border-radius: 5%;
}
.card .img::after {
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
  .card.foil .img::after {
    background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.9) 25%, rgba(255,255,0,0.9) 50%, rgba(255,0,0,0.9) 75%, rgba(255,0,0,0.9) 100%);
    mix-blend-mode: multiply;
    opacity: .5;
  }
}
@supports (mix-blend-mode: soft-light) {
  .card.foil .img::after {
    background: linear-gradient(115deg, rgba(0,255,0) 0%, rgba(0,255,0) 25%, rgba(255,255,0) 50%, rgba(255,0,0) 75%, rgba(255,0,0) 100%);
    opacity: .4;
    /* background: linear-gradient(115deg, #4285f4, #34a853, #fbbc05, #ea4335); */
    background:linear-gradient(120deg, #185494, #EE1D23, #FAAF18, #FFFFFF);
    opacity: .6;
    mix-blend-mode: soft-light;
    background: repeating-linear-gradient(170deg, #185494 0%, #EE1D23 10%, #FAAF18 20%, #AEE2A0 30%, #185494 40%);
    opacity: .4;
    mix-blend-mode: multiply;
  }
}
.price {
  display: flex;
  /* justify-content: space-between; */
  flex-wrap: wrap;
}
/* @supports (mix-blend-mode: hard-light) {
  .card.foil .img::after {
    background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.25) 25%, rgba(255,255,0,0.3) 50%, rgba(255,0,0,0.15) 75%, rgba(255,0,0,0.3) 100%);
    mix-blend-mode: hard-light;
    opacity: 1;
  }
} */
.prices {
  display: flex;
  flex-wrap: wrap;
}
.prices .price {
  opacity: .4;
}
.prices .price.match {
  opacity: 1;
}
.sidepanel .cards {
  grid-template-columns: auto;
  padding: 3rem;
}
.sidepanel .card {
  min-width: 100%;
}

@media (max-width: 640px) {
  #main .cards {
    padding: 0 10vw;

  }
  .cards {
    justify-content: center;
	  scroll-snap-type: y mandatory;
  }
  .card {
    scroll-snap-align: start;
  }
  .card img {
    /* aspect-ratio: .72; */
  }
  .card .buttons {
    display: flex !important;
  }
}
</style>