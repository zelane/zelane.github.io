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

* {
  box-sizing: border-box;
  scrollbar-color: var(--colour-input-grey) var(--colour-sidebar);
}
html {
  font-size: 16px;
}
body {
  --default-fonts: "Spectral", Helvetica, Arial, sans-serif;
  --default-br: 1px;
  --default-shadow: 3px 3px 4px 0px rgba(0, 0, 0, 0.15),
    inset 1px 1px 1px 0px rgba(255, 255, 255, 0.03);
  --default-border: none;
  --colour-sidebar: #171317;
  --colour-input-grey: #221e26;
  --colour-input-grey: #2e2933;
  --colour-light-font: #efefef;
  --colour-dark-grey: #110d12;
  --colour-accent: #938996;

  --colour-red: #f9ac90;
  --colour-green: #9cd4af;
  --colour-blue: #75d3ff;
  --colour-black: #ccc3c0;
  --colour-white: #fff7b1;
  --colour-less: #cdc3c1;

  --font-magic: "Beleren SmallCaps Bold";

  --height-input: 2.5rem;

  padding: 0;
  margin: 0;
  color: #efefef;
  background-color: #100c0f;
  background-color: var(--colour-dark-grey);
  --slider-height: 2rem;
  --slider-bg: #918295;
  --slider-connect-bg: var(--colour-input-grey);
  --slider-radius: var(--default-br);
  --slider-handle-bg: #e5dbdc;
  --slider-handle-height: 2.1rem;
  --slider-handle-width: 2.1rem;
  --slider-handle-radius: 2px;
  --slider-handle-shadow: var(--default-shadow);
  --slider-handle-ring-width: 0px;
  --slider-tooltip-bg: #10b981;
  --slider-tooltip-font-size: 1rem;
  --slider-tooltip-bg: transparent;
  --slider-tooltip-color: var(--colour-input-grey);
  /* --slider-tooltip-py: 0; */
  --slider-tooltip-line-height: 1.5rem;
  /* --slider-tooltip-px: 1rem; */
  --slider-tooltip-distance: -2.1rem;
  --slider-tooltip-arrow-size: 0px;

  --ms-radius: var(--default-br);
  --ms-bg: var(--colour-input-grey);
  --ms-dropdown-bg: var(--colour-input-grey);
  --ms-tag-bg: #6f334c;

  --ms-color: var(--colour-light-font);
  --ms-font-size: 1rem;
  /* --ms-line-height: 1; */
  /* --ms-dropdown-line-height: 1; */
  /* --ms-option-font-size: 1rem; */
  /* --ms-option-line-height: 1; */
  /* --ms-max-height: var(--height-input); */
  /* --ms-border-width: 0; */
}
.multiselect-dropdown {
  box-shadow: var(--default-shadow);
}
button,
.button {
  font-family: var(--default-fonts);
  border: var(--default-border);
  min-width: 120px;
  min-height: var(--height-input);
  border-radius: var(--default-br);
  box-shadow: var(--default-shadow);
  background-color: var(--colour-input-grey);
  color: var(--colour-light-font);
  font-size: 1rem;
  /* font-weight: 600; */
  line-height: var(--height-input);
  text-align: center;
  cursor: pointer;
  transition: all 0.1s;
  /* margin-top: 1px; */
  /* margin-bottom: 1px; */
}
button:hover,
button.small:hover,
.button:hover,
.button.small:hover {
  /* margin-top: 2px; */
  /* margin-bottom: 0px; */
  /* box-shadow: 0px 1px 1px #000; */
  background-color: #39343e;
}
button.small,
.button.small {
  border-radius: var(--default-br);
  min-width: var(--height-input);
  height: var(--height-input);
  text-align: center;
  line-height: var(--height-input);
  font-size: 1.5rem;
  background-color: var(--colour-input-grey);
  font-family: "Beleren SmallCaps Bold";
  box-shadow: var(--default-shadow);
  color: #e5dbdc;
}
.upload textarea {
  background-color: var(--colour-input-grey);
  border: none;
  border-radius: var(--default-br);
  color: #efefef;
  font-family: "Spectral", Helvetica, Arial, sans-serif;
  padding: 1.25rem;
  box-sizing: border-box;
}
.slider-target {
  box-shadow: var(--default-shadow);
}
div,
span {
  box-sizing: border-box;
}
#app {
  font-family: var(--default-fonts);
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input[type="text"]:not(.multiselect-tags-search),
input[type="search"]:not(.multiselect-tags-search),
input[type="number"] {
  background-color: var(--colour-input-grey);
  box-shadow: var(--default-shadow) !important;
  border: var(--default-border);
  color: #efefef;
  height: var(--height-input);
  border-radius: var(--default-br);
  padding: 0 10px;
  font-family: var(--default-fonts);
  font-size: 1rem;
}

.multiselect {
  /* background-color: var(--colour-input-grey); */
  box-shadow: var(--default-shadow) !important;
  border: var(--default-border);
}
.multiselect-search {
  background-color: var(--colour-input-grey);
  height: var(--height-input);
  color: #efefef;
}
.multiselect-tags-search {
  background-color: var(--colour-input-grey);
  color: #efefef;
}
.multiselect-dropdown {
  background-color: var(--colour-input-grey);
  border: var(--default-border);
}
.multiselect-option {
  background-color: var(--colour-input-grey);
}
</style>
