<script setup>

  const props = defineProps({cards: Array, zoom: Number, loading: Boolean});
  const emit = defineEmits(['clip', 'viewPrints']);

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
      :class="{foil: card.is_foil}"
      v-for="card in props.cards.slice(0, 500)"
      :key="card.id + card.is_foil + card.is_etched"
    >
      <div class="img">
        <img
          v-if="card.image_uris"
          :src="card.image_uris.normal"
        >
        <img
          class="flip front"
          v-if="card.card_faces && card.card_faces[0].image_uris"
          :src="card.card_faces[0].image_uris.normal"
        >
        <img
          class="flip back"
          v-if="card.card_faces && card.card_faces[0].image_uris"
          :src="card.card_faces[1].image_uris.normal"
        >
        <div class="buttons">
          <button
            class="small prints icon icon-prints"
            @click.stop="emit('viewPrints', card.name);"
            title="View all prints"
          />
          <button
            class="small clip icon icon-add"
            @click.stop="emit('clip', card)"
            title="Add to clipboard"
          />
        </div>
      </div>
      <p class="name">
        {{ card.count }} {{ card.name }} {{ card.is_foil ? '☆' : '' }} {{ card.is_etched ? '#' : '' }}
      </p>
      <p>{{ card.set_name }}</p>
      <p>
        {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.price) }}
        <a
          :href="card.purchase_uris.cardmarket"
          target="_blank"
          class="set"
        >{{ card.set }}:{{ card.collector_number }}</a>
        <!-- <a :href="card.purchase_uris.cardmarket" target="_blank"></a> -->
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
.card .set {
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
.card.foil .img::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.25) 25%, rgba(255,255,0,0.3) 50%, rgba(255,0,0,0.15) 75%, rgba(255,0,0,0.3) 100%);
  border-radius: 5%;
}
/* @supports (mix-blend-mode: hard-light) {
  .card.foil .img::after {
    background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.25) 25%, rgba(255,255,0,0.3) 50%, rgba(255,0,0,0.15) 75%, rgba(255,0,0,0.3) 100%);
    mix-blend-mode: hard-light;
    opacity: 1;
  }
} */
@supports (mix-blend-mode: multiply) {
  .card.foil .img::after {
    background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.9) 25%, rgba(255,255,0,0.9) 50%, rgba(255,0,0,0.9) 75%, rgba(255,0,0,0.9) 100%);
    mix-blend-mode: multiply;
    opacity: .6;
  }
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