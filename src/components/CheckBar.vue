<script setup>

// const props = defineProps({

// });


const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

</script>

<template>
  <span class="checkbar">
    <input
      id="auto-add"
      type="checkbox"
      :value="props.modelValue"
      @input="e => emit('update:modelValue', e.target.value)"
    >
    <label
      for="auto-add"
      class="text"
    >
      <slot />
    </label>
    <label
      for="auto-add"
      class="button small icon"
    />
  </span>
</template>

<style scoped>
.checkbar {
  display: flex;
  align-items: center;
}
.text {
  flex-grow: 1;
  user-select: none;
}
.button {
  flex-shrink: 1;
}
input[type=checkbox] {
  display: none;
}
input[type=checkbox] ~ label.button:after {
  font-family: var(--font-icons);
  content: "\e909";
  color: var(--colour-red);
  /* padding: 0 1rem; */
}
input[type=checkbox]:checked ~ label.button:after {
  content: "\e939";
  color: var(--colour-green);
}
</style>