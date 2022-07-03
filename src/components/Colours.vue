<script setup>
import { reactive, watchEffect } from 'vue';
import { v4 as uuidv4 } from "uuid";


const colours = {
  Red: 'R', Green: 'G', Black: 'B', Blue: 'U', White: 'W', Colourless: 'C',
};

const value = reactive({ colours: [] });
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

const uid = uuidv4();

watchEffect(() => {
  emit("update:modelValue", value.colours);
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
        :id="uid + code"
      >
      <label
        :for="uid + code"
        :class="'icon icon-' + code"
      />
    </div>
  </div>
</template>

<style scoped>

.colours,
.rarities {
  display: flex;
  gap: 0 .5rem;
}
.rarities {
  gap: 0 .5rem;
}
.colours input[type="checkbox"]:checked + label,
.rarities input[type="checkbox"]:checked + label {
  opacity: 1;
}
.rarities .input-group {
  min-width: 40px;
}
.colours .input-group input[type="checkbox"],
.rarities input[type="checkbox"] {
  display: none;
}
.colour label,
.rarity label {
  display: block;
  width: var(--height-input);
  opacity: 0.5;
  transition: all 0.1s;
  cursor: pointer;
  /* box-shadow: var(--default-shadow); */
}

.colour label {
  color: #938996;
  background-color: transparent;
  height: var(--height-input);
  width: var(--height-input);
  line-height: var(--height-input);
  border-radius: 50%;
  font-size: calc(var(--height-input) - 5px);
  text-align: center;
}
.colour.selected label {
  color: #01121c;
}
.colour[data-colour="R"].selected label {
  color: var(--colour-red);
}
.colour[data-colour="G"].selected label {
  color: var(--colour-green);
}
.colour[data-colour="B"].selected label {
  color: var(--colour-black);
}
.colour[data-colour="U"].selected label {
  color: var(--colour-blue);
}
.colour[data-colour="W"].selected label {
  color: var(--colour-white);
}
.colour[data-colour="C"].selected label {
  color: var(--colour-less);
}
</style>