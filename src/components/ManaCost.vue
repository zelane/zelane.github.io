<script setup>
import { useMeta } from '../stores/meta';

const meta = useMeta();

const props = defineProps({
    mana: {
        type: String,
        required: true
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

</script>

<template>
  <span
    class="icons" 
    v-if="props.mana"
    v-html="parseColours(props.mana)"
  />
</template>

<style scoped>
.icons {
  display: flex;
  gap: .1em;
  vertical-align: middle;
}
</style>