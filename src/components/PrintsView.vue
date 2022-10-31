<script setup>
import CardView from './CardView.vue';
import { usePrintsView } from '../stores/cards';

const prints = usePrintsView();
const emit = defineEmits(['changed']);

</script>

<template>
  <h3>Prints</h3>
  <CardView
    class="prints"
    :store="prints"
    :actions="['clip']"
  />
</template>

<style scoped>
</style>
