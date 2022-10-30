<script setup>
import { reactive } from 'vue';
import { useDetails } from '../stores/details';
import { useMeta } from '../stores/meta';

const details = useDetails();
const meta = useMeta();

const emit = defineEmits(["changed"]);

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
});

const ui = reactive({
  face: 0
});

const parseColours = (text) => {
  if(!text) {
    return "";
  }
  const all = /(\{[aA-zZ0-9/]+\})/g;
  text = text.replace(
      all, (_, v) => `<img class='symbol' src='${meta.symbols.get(v)}' />`
    );
  return text;
};

const copyJson = card => {
  navigator.clipboard.writeText(JSON.stringify(card, null, 2));
};

</script>

<template>
  <div class="root">
    <div
      class="face"
      v-for="(face, index) in (props.card.card_faces || [props.card])"
      :key="face + index"
      :class="{show: ui.face === index}"
    >
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
      {{ parsecolours(props.card.oracle_text) }}
    </p> -->
    <div
      class="rulings"
      v-if="details.rulings.length > 0 && false"
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
  
    <a @click="copyJson(props.card)">
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
  margin: 1rem 0;
}
.icon {
  font-size: 1.2em;
}
</style>