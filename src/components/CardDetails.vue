<script setup>
import { useDetails } from '../stores/details';
import { useMeta } from '../stores/meta';
import CardSummary from './CardSummary.vue';
import CardActions from './CardActions.vue';
import { useCardView } from '../stores/cards';

const details = useDetails();
const meta = useMeta();
const cards = useCardView();

const emit = defineEmits(["changed"]);

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  face: {
    type: Number,
    default: 0
  }
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
  <CardActions
    :card="props.card"
    @select="cards.selected.add(card.id + card.finish)"
    @deselect="cards.selected.delete(card.id + card.finish)"
  />
  <CardSummary :card="props.card" />
  <div
    class="face"
    v-for="(face, index) in (props.card.card_faces || [props.card])"
    :key="face + index"
    :class="{show: props.face === index}"
  >
    <div class="oracle-text">
      <div
        v-for="(text, i) in face.oracle_text?.split('\n')"
        :key="'oracle' + i"
      >
        <span v-html="parseColours(text)" />
      </div>
    </div>
  </div>

  <div
    class="rulings"
    v-if="details.rulings.length > 0"
  >
    <details @click.stop="">
      <summary>
        Rulings
      </summary>

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
    </details>
  </div>
  
  <a @click="copyJson(props.card)">
    Copy Json
  </a>
</template>

<style scoped>
img {
  width: 100%;
  border-radius: 4%;
}
a {
  cursor: pointer;
  user-select: none;
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
  background-color: var(--colour-input-grey);
  padding: 1rem;
  margin: 0 -1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 3px 6px 0px #0b0b0b4d;
  font-size: 1.1rem;
  line-height: 1.2;
}
.icon {
  font-size: 1.2em;
}
details summary {
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
}
details .list {
  max-height: 30vh;
  overflow: auto;
  line-height: 1.2;
}

@media (max-width: 640px) {
  details .list {
    max-height: none;
  }
}
</style>