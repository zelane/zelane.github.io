<script setup>
import { reactive, watchEffect } from 'vue';


const colours = {
  Red: 'R', Green: 'G', Black: 'B', Blue: 'U', White: 'W', Colourless: 'C',
};

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {return {colours: [], or: false};}
  }
});

const value = reactive({ colours: [], or: false });
const emit = defineEmits(['update:modelValue']);

const twoColours = {
  Azorius: ['U', 'W'],
  Boros: ['R', 'W'],
  Dimir: ['B', 'U'],
  Golgari: ['B', 'G'],
  Gruul: ['G', 'R'],
  Izzet: ['R', 'U'],
  Orzhov: ['B', 'W',],
  Rakdos: ['B', 'R'],
  Selesnya: ['G', 'W'],
  Simic: ['G', 'U'],
};
const threeColours = {
  Abzan: ['B', 'G', 'W'],
  Bant: ['G', 'U', 'W'],
  Esper: ['B', 'U', 'W'],
  Grixis: ['B', 'R', 'U'],
  Jeskai: ['R', 'U', 'W'],
  Jund: ['B', 'G', 'R'],
  Mardu: ['B', 'R', 'W'],
  Naya: ['G', 'R', 'W'],
  Sultai: ['B', 'G', 'U'],
  Temur: ['G', 'R', 'U'],
};
const fourColours = {
  Glint: 'W',
  Dune: 'U',
  Ink: 'B',
  Witch: 'R',
  Yore: 'G',
};

watchEffect(() => {
  emit("update:modelValue", value);
});

const matchColours = (colours) => {
  let _colours = [...colours].sort();
  if (colours.length === 2) {
    for (const [key, value] of Object.entries(twoColours)) {
      if (_colours.every((v, i) => v === value[i])) return key;
    }
  }
  else if (colours.length === 3) {
    for (const [key, value] of Object.entries(threeColours)) {
      if (_colours.every((v, i) => v === value[i])) return key;
    }
  }
  else if (colours.length === 4) {
    for (const [key, value] of Object.entries(fourColours)) {
      if (!colours.includes(value)) return key;
    }
  }
};

</script>

<template>
  <div class="filter-group colours">
    <div class="header">
      <h3> {{ value.colours.length > 1 ? `${matchColours(value.colours)}` : '' }}</h3>
      <div
        class="bi-toggle"
        :class="{ active: value.or }"
        @click="value.or = !value.or"
      >
        {{ value.or ? "And" : "Or" }}
      </div>
    </div>
    
    <div
      class="input-group colour"
      :class="value.colours.includes(code) ? 'selected' : ''"
      :data-colour="code"
      v-for="code in colours"
      :key="code"
    >
      <input
        type="checkbox"
        v-model="value.colours"
        :value="code"
        :id="code"
      >
      <label
        :for="code"
        :class="'icon icon-' + code"
      />
    </div>
  </div>
</template>