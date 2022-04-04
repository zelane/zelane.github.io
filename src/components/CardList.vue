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
      v-for="card in props.cards.slice(0, 500)"
      :key="card.id"
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
            class="small prints icon icon-library_books"
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
        {{ card.count }} {{ card.name }}
      </p>
      <p>{{ card.set_name }}</p>
      <p>
        {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(card.price) }}
        <span class="set">{{ card.set }}:{{ card.collector_number }}</span>
      </p>

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
}
.card .img:hover .buttons {
  display: flex;
  flex-direction: column;
  gap: .5rem;
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
.card .set {
  color: #827684;
}
.card img {
  width: 100%;
  border-radius: 5%;
  box-shadow: 0px 2px 5px #000000f2;
}

@media (max-width: 640px) {
  .cards {
    justify-content: center;
	  scroll-snap-type: y mandatory;
  }
  .card {
    scroll-snap-align: start;
  }
}
</style>