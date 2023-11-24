<script setup lang="ts">
import { PropType } from 'vue';
import { Card } from '../models/Card';

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true
  },
  effects: {
    type: Array,
    default: () => []
  },
  actions: {
    type: Array,
    default: () => ['clip', 'delete', 'prints']
  }
});
</script>

<template>
  <div
    class="img"
    :class="{
      [props.card.finish]: true,
      [props.effects]: true,
    }"
  >
    <img
      v-if="props.card.data && props.card.data.image_uris"
      :srcset="`${props.card.data.image_uris.normal}, ${props.card.data.image_uris.large} 2x, ${props.card.data.image_uris.large} 400w`"
      loading="lazy"
      crossorigin="anonymous"
    >
    <img
      class="flip front"
      v-if="props.card.data.card_faces && props.card.data.card_faces[0].image_uris"
      :src="props.card.data.card_faces[0].image_uris.normal"
      loading="lazy"
      crossorigin="anonymous"
    >
    <img
      class="flip back"
      v-if="props.card.data.card_faces && props.card.data.card_faces[0].image_uris"
      :src="props.card.data.card_faces[1].image_uris.normal"
      loading="lazy"
      crossorigin="anonymous"
    >
  </div>
  <!-- <a
    v-if="details.card.card_faces"
    @click="ui.face = (index + 1) % details.card.card_faces.length"
  >
    Flip
  </a> -->
</template>

<style scoped>

img {
  width: 100%;
  border-radius: 5%;
  aspect-ratio: 2.5/3.5;
  box-shadow: 0px 2px 5px #000000f2, 0px 0px 2px 2px black;
  transition: filter 0.3s;
  /* border: 2px solid #9c9c9c24; */
  /* border: 2px solid #000000; */
}
.img {
  border-radius: 5%;
  position: relative;
  /* height: 158px; */
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
  transition: backdrop-filter 0.2s;
}
.img.foil::after {
  background: linear-gradient(115deg, rgba(0,255,0,0) 0%, rgba(0,255,0,0.25) 25%, rgba(255,255,0,0.3) 50%, rgba(255,0,0,0.15) 75%, rgba(255,0,0,0.3) 100%);
}
.img.etched::after {
  background: linear-gradient(115deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
  opacity: .15;
  mix-blend-mode: hard-light;
}
@supports (mix-blend-mode: multiply) {
  .img.foil::after {
    background: repeating-linear-gradient(170deg, #b6d9ff 0%, #FFD4D5 10%, #FFDC96 20%, #DCFFD3 30%, #b5d8ff 40%);
    opacity: 1;
    mix-blend-mode: multiply;
  }
}

.img:is(.have, .exact, .missing)::after {
  display: none;
}

.img.have img{
  filter: saturate(3%);
    /* box-shadow: 0 2px 10px 0 #ffffff55, 0px 2px 5px #000000f2; */
}
.img.exact img{
  /* filter: saturate(100%); */
    /* box-shadow: 0 2px 10px 0 #ffd6877d, 0px 2px 5px #000000f2; */
}
.img.missing img {
  filter: saturate(0%) opacity(.4);
}
.flip.back {
  display: none;
}
.img:hover .flip.front {
  display: none;
}
.img:hover .flip.back {
  display: initial;
}
</style>