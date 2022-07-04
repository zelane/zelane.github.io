<script setup>
import { reactive } from 'vue';
import { useDetails } from '../stores/details';

const details = useDetails();

const emit = defineEmits(["changed"]);

const ui = reactive({
  face: 0
});

const parseColours = (text) => {
  if(!text) {
    return "";
  }
  const colourless = /\{([0-9]+)\}/g;
  const coloured = /\{([WUBRGXC])\}/g;
  const dual = /\{([WUBRGXCP0-9])\/([WUBRGXCP0-9])\}/g;
  const tap = /\{([T])\}/g;
  text = text.replace(
      colourless, "<span class='ms ms-cost ms-$1'></span>"
    ).replace(
      coloured, (_, v) => `<span class='ms ms-cost ms-${v.toLowerCase()}'></span>`
    ).replace(
      dual, (_, a, b) => `<span class='ms ms-cost ms-${a.toLowerCase() + b.toLowerCase()}'></span>`
    ).replace(
      tap, "<span class='ms ms-cost ms-tap'></span>"
    );
  return text;
};

const copyJson = card => {
  navigator.clipboard.writeText(JSON.stringify(card, null, 2));
};

details.$onAction(() => {
  emit('changed');
});

</script>

<template>
  <div class="root">
    <div
      class="face"
      v-for="(face, index) in (details.card.card_faces || [details.card])"
      :key="face + index"
      :class="{show: ui.face === index}"
    >
      <img
        v-if="face.image_uris"
        :srcset="`${face.image_uris.normal}, ${face.image_uris.large} 2x, ${face.image_uris.large} 400w`"
        loading="lazy"
      >
      <a
        v-if="details.card.card_faces"
        @click="ui.face = (index + 1) % details.card.card_faces.length"
      >
        Flip
      </a>
      <div class="oracle-text">
        <div
          v-for="(text, i) in face.oracle_text?.split('\n')"
          :key="'oracle' + i"
        >
          <!-- {{ text }} -->
          <span v-html="parseColours(text)" />
        </div>
      </div>
      <!-- <p v-html="face.oracle_text.replace('\n', '<br><br>')" /> -->
    </div>

    <!-- <p>
      {{ parsecolours(details.card.oracle_text) }}
    </p> -->
    <div
      class="rulings"
      v-if="details.rulings.length > 0"
    >
      <h3>Rulings</h3> 
      <div class="list">
        <div
          class="ruling"
          v-for="(ruling, index) in details.rulings"
          :key="index"
        >
          <span :class="{header: ruling.comment.startsWith('----------')}">
            {{ ruling.comment.replaceAll('----------', '') }}
          </span>
        </div>
      </div>
    </div>
  
    <a @click="copyJson(details.card)">
      Copy Json
    </a>
  </div>
</template>

<style scoped>
.root {
  /* height: 100%; */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 1.1rem;
  line-height: 1.2;
}
img {
  width: 100%;
  border-radius: 4%;
}
a {
  cursor: pointer;
  user-select: none;
}
.face {
  display: none;
}
.face a {
  display: block;
  line-height: 2;
  width: 100%;
  text-align: center;
}
.face.show {
  display: initial;
}
.rulings .list {
  display: flex;
  flex-direction: column;
}
.ruling {
  border-bottom: 1px dashed var(--colour-accent);
  padding: 1rem 0;
}
.ruling .header {
  font-weight: 600;
}
.oracle-text {
  background-color: rgba(255,255,255,0.1);
  padding: 1rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem -2rem;
}
.icon {
  font-size: 1.2em;
}
</style>