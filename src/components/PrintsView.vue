<script setup>
import CardView from './CardView.vue';
import { usePrintsView } from '../stores/cards';

const prints = usePrintsView();
const emit = defineEmits(['changed']);

</script>

<template>
  <h3>Prints</h3>
  <div class="prints">
    <CardView
      :store="prints"
      :actions="['clip']"
    />
  </div>
</template>

<style scoped>
</style>
