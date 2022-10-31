<script setup>
const props = defineProps({
  card: {
    type: Object,
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
  box-shadow: 0px 2px 5px #000000f2;
}
.img {
  border-radius: 5%;
  position: relative;
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
  transition: all 0.2s;
}
.img.missing {
  /* opacity: 0.5; */
}
.img.missing::after {
  /* opacity: 0.5; */
  /* background-color: rgba(0,0,0,0.6); */
  backdrop-filter: brightness(50%) grayscale(75%);

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