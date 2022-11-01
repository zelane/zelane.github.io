<script setup>
import { reactive, watchEffect } from 'vue';
import { useMeta } from '../stores/meta';
import { useUI } from '../stores/ui';
import CardSummary from './CardSummary.vue';
import Multiselect from '@vueform/multiselect';
import CardSearch from './CardSearch.vue';
import { useCollections } from '../stores/collections';
import { deepUnref } from 'vue-deepunref';

const ui_ = useUI();
const meta = useMeta();
const collections = useCollections();

const ui = reactive({
  set: null,
  count: 0,
});

watchEffect(() => {
  if(ui_.edit.card) {
    ui.set = ui_.edit.card.set;
    ui.count = ui_.edit.card.count;
  }
});

const emit = defineEmits(['change']);

const save = async () => {
  let new_ = deepUnref(ui_.edit.card);
  new_.set = ui.set;
  new_.count = ui.count;
  await collections.replaceCard(collections.open[0], ui_.edit.card, new_);
  ui_.edit.card.set = ui.set;
  ui_.edit.card.count = ui.count;
};

</script>

<template>
  <div v-if="ui_.edit.card">
    <CardSummary :card="ui_.edit.card" />
    <div class="form">
      <input
        type="number"
        placeholder="Count"
        v-model="ui.count"
      >
      <!-- <Multiselect
        v-model="ui.set"
        :options="meta.sets"
        :searchable="true"
        label="name"
        value-prop="code"
        mode="single"
        placeholder="Set"
      /> -->
      <button @click="save">
        Save
      </button>
    </div>
    <hr>
    <!-- <h3>Replace</h3> -->
    <!-- <CardSearch @selected="save" /> -->
  </div>
</template>

<style scoped>
  .form {
    display: grid;
    gap: 1rem;
  }
</style>