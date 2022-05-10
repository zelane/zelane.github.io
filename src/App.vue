<script setup>
import Page from './components/Page.vue';
</script>

<template>
  <Page />
</template>

<style src="@vueform/multiselect/themes/default.css"></style>
<style src="@vueform/slider/themes/default.css"></style>
<style src="@vueform/toggle/themes/default.css"></style>
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
::-webkit-scrollbar-thumb  {
  background-color: var(--colour-input-grey);
  width: 1rem;
}
::-webkit-scrollbar {
  background-color: var(--colour-sidebar);
  width: 1rem;
}
:root {
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
  --colour-off-white: #e5dbdc;
  --colour-anchor: #c49dcb;

  --colour-red: #f9ac90;
  --colour-green: #9cd4af;
  --colour-blue: #75d3ff;
  --colour-black: #ccc3c0;
  --colour-white: #fff7b1;
  --colour-less: #cdc3c1;

  --font-magic: "Beleren Bold";
  --font-magic-smallcaps: "Beleren SmallCaps Bold";

  --height-input: 2.5rem;
  --slider-height: 2rem;
  --slider-bg: #918295;
  --slider-connect-bg: var(--colour-input-grey);
  --slider-radius: var(--default-br);
  --slider-handle-bg: var(--colour-off-white);
  --slider-handle-height: 2.1rem;
  --slider-handle-width: 2.1rem;
  --slider-handle-radius: 2px;
  --slider-handle-shadow: var(--default-shadow);
  --slider-handle-ring-width: 0px;
  --slider-tooltip-font-size: 1rem;
  --slider-tooltip-bg: transparent;
  --slider-tooltip-color: var(--colour-input-grey);
  /* --slider-tooltip-py: 0; */
  --slider-tooltip-line-height: 1.5rem;
  /* --slider-tooltip-px: 1rem; */
  --slider-tooltip-distance: -2.1rem;
  --slider-tooltip-arrow-size: 0px;

  --ms-max-height: 25vh;
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

  --toggle-height: 1.5rem;
  --toggle-width: 4rem;
  --toggle-font-size: .8rem;
  --toggle-bg-on: var(--colour-input-grey);
  --toggle-bg-off: var(--colour-input-grey);
  --toggle-text-on: var(--colour-light-font);
  --toggle-text-off: var(--colour-light-font);
  --toggle-border: 2px solid var(--colour-input-grey);
  --toggle-border-on: 0;
  --toggle-border-off: 0;
  --toggle-ring-width: 0;
  --toggle-handle-enabled: var(--colour-off-white);

  /* image-rendering: -webkit-optimize-contrast; */

}
body {

  padding: 0;
  margin: 0;
  color: #efefef;
  background-color: #100c0f;
  background-color: var(--colour-dark-grey);
}
a {
  text-decoration: none;
  color: var(--colour-anchor);
  font-family: var(--font-magic);
  font-weight: 500;
}
textarea {
  background-color: var(--colour-input-grey);
  grid-column: 2;
  width: 100%;
  height: 300px;
}
  textarea {
  background-color: var(--colour-input-grey);
  border: none;
  border-radius: var(--default-br);
  color: #efefef;
  font-family: "Spectral", Helvetica, Arial, sans-serif;
  padding: 1.25rem;
  box-sizing: border-box;
}
.bi-toggle {
  background-color: var(--colour-input-grey);
  padding: .5rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  user-select: none;
}
.multiselect-dropdown {
  box-shadow: var(--default-shadow);
}
.multiselect-single-label {
  padding-right: 1rem !important;
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
:is(button, button.small, .button, .button.small):hover {
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
  font-family: var(--font-magic-smallcaps);
  box-shadow: var(--default-shadow);
  color: #e5dbdc;
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
  max-height: var(--ms-max-height);
}
.multiselect-option {
  background-color: var(--colour-input-grey);
}
hr {
  margin: 20px 0;
  border-color: var(--colour-dark-grey);
  opacity: 0.4;
  border-width: 1px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
}
h3 {
  padding: 0;
  margin: 0;
  margin-bottom: .5rem;
}
.action {
  display: block;
  text-align: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1.5rem;
  line-height: 1.7rem;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--colour-dark-grey);
  font-family: var(--font-magic);
}
.action.icon {
  font-size: 1rem;
}
.Vue-Toastification__toast--default.toast {
  background-color: var(--colour-input-grey);
  box-shadow: var(--default-shadow);
  font-family: var(--default-fonts);
  border-radius: var(15px);
  padding: .8rem 2rem;
  min-height: 0;
  text-align: center;
}
/* .Vue-Toastification__toast--default.toast .Vue-Toastification__toast-body {
  line-height: 1;
}
.Vue-Toastification__toast--default.toast .Vue-Toastification__progress-bar {
  display: none;
} */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.fade-enter-active {
  animation-name: fadeIn;
  animation-duration: .4s;
  animation-fill-mode: both;
}
.fade-leave-active {
  animation-name: fadeOut;
  animation-duration: .4s;
  animation-fill-mode: both;
}
.fade-move {
  transition-timing-function: ease-in-out;
  transition-property: all;
  transition-duration: .2s;
}
.filter-group {
  flex-flow: wrap;
}
.filter-group .header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-group h3 {
  font-family: "Beleren SmallCaps Bold";
  /* font-family: "Spectral"; */
  font-weight: 500;
  font-size: 1rem;
}
.filter-group > h3 {
  margin-bottom: 10px;
  flex-basis: 100%;
}
.filter-group > input {
  width: 100%;
}
</style>
