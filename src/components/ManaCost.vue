<script setup>

const props = defineProps({
    mana: {
        type: String,
        required: true
    }
});

const split = mana => {
  const m = [];
  const re = /\{([0-9a-zA-Z]+)\}/g;
  const parts = mana.matchAll(re);
  for (const p of parts) {
    m.push(p[1]);
  }
  return m;
};

</script>

<template>
  <span
    class="icons" 
    v-if="props.mana"
  >
    <span
      v-for="(m, i) in split(props.mana)"
      :key="i"
      :class="`icon icon-${m}`"
    >
      <template v-if="!isNaN(m)">{{ m }}</template>
    </span>
  </span>
</template>

<style scoped>
.icons {
  display: flex;
  gap: .2em;
  vertical-align: middle;
  /* letter-spacing: .2em; */
}
.icon {
  font-size: 1.2em;
}
.icon-1, .icon-2, .icon-3, .icon-4, .icon-5, .icon-6, .icon-7 {
  display: inline-block;
  background-color: var(--colour-less);
  border-radius: 50%;
  color: black;
  text-align: center;
  line-height: 0.8em;
  width: 1em;
  height: 1em;
  font-weight: bold;
}
.icon-R {
  color: var(--colour-red);
}
.icon-G {
  color: var(--colour-green);
}
.icon-B {
  color: var(--colour-black);
}
.icon-U {
  color: var(--colour-blue);
}
.icon-W {
  color: var(--colour-white);
}
</style>