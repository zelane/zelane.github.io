<script setup>

import { ref } from 'vue';
const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  actions: {
    type: Object,
    default: () => {}
  }
});
const emit = defineEmits(['click']);
const show = ref(false);
</script>

<template>
  <div
    class="menu-button"
  >
    <button 
      @click="show = !show"
    >
      {{ props.text }}
    </button>
    <div
      class="v-menu"
      :class="{show: show}"
    >
      <button
        v-for="(value, label) in props.actions"
        :key="label"
        @click="emit('click', value)"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.menu-button {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  height: var(--height-input);
  gap: 10px;
}
.menu-button button {
  z-index: 2;
}
.menu-button .v-menu {
  display: flex;
  flex-direction: column-reverse;
  opacity: 0;
  pointer-events: none;
  transition: all 0.1s ease-in-out;
  transform: translate(0, 3rem);
  z-index: 1;
  gap: 10px;
  background-color: var(--colour-sidebar);
  max-height: 50vh;
  overflow: auto;
  position: absolute;
  bottom: 3.5rem;
  /* max-width: 17rem; */
  right: 0;
}
.menu-button .v-menu button {
  max-width: 17rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menu-button .v-menu.show {
  opacity: 1;
  pointer-events: all;
  transform: translate(0, 0);
}
</style>