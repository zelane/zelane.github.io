<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from './components/HelloWorld.vue';
</script>

<template>
  <HelloWorld />
</template>

<style src="@vueform/multiselect/themes/default.css"></style>
<style src="@vueform/slider/themes/default.css"></style>
<style>
@import "./assets/fonts/index.css";
@import url("https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=PT+Serif:wght@400;700&family=Spectral:wght@300;400;500&display=swap");

body {
  padding: 0;
  margin: 0;
  color: #efefef;
  background-color: #1a1a1e;
  --slider-height: 30px;
  --slider-connect-bg: #222;
  --slider-radius: 4px;
  --slider-handle-bg: #e5dbdc;
  --slider-handle-height: 30px;
  --slider-handle-width: 30px;
  --slider-handle-radius: 4px;
  --slider-handle-shadow: 0px 2px 1px #000;
  --slider-handle-ring-width: 0px;
  --slider-tooltip-bg: #10b981;
  --slider-tooltip-font-size: 1rem;
  --slider-tooltip-bg: transparent;
  --slider-tooltip-color: #222;
  --slider-tooltip-py: 2px;
  --slider-tooltip-px: 6px;
  --slider-tooltip-distance: -30px;
  --slider-tooltip-arrow-size: 1px;
}
.slider-target {
  box-shadow: 0px 2px 1px #000;
}
div,
span {
  box-sizing: border-box;
}
#app {
  font-family: "Spectral", Helvetica, Arial, sans-serif;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input[type="search"]:not(.multiselect-tags-search),
input[type="number"] {
  background-color: #222;
  box-shadow: 0px 2px 1px #000 !important;
  border: none;
  color: #efefef;
  height: 40px;
  border-radius: 4px;
  padding: 0 10px;
}

.multiselect {
  background-color: #222;
  box-shadow: 0px 2px 1px #000 !important;
  border: none;
}
.multiselect-search {
  background-color: #222;
  height: 40px;
  color: #efefef;
}
.multiselect-tags-search {
  background-color: #222;
  color: #efefef;
}
.multiselect-dropdown {
  background-color: #222;
  border: none;
}
.multiselect-option {
  background-color: #222;
}
</style>
