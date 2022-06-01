import { createApp } from 'vue';
import App from './App.vue';
import Toast, { POSITION } from "vue-toastification";
import { createRouter, createWebHashHistory } from 'vue-router';
import Page from './components/Page.vue';

import "vue-toastification/dist/index.css";

const routes = [
    { path: '/:view?', component: Page, props: true },
];
const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

const app = createApp(App);
app.use(router);
app.use(Toast, {
    position: POSITION.BOTTOM_CENTER,
    closeButton: false,
    hideProgressBar: true,
    // containerClassName: "main",
    // container: asyncGetContainer,
    toastClassName: "toast",
    // bodyClassName: ["custom-class-1", "custom-class-2"],
    icon: false,
    pauseOnHover: false,
    timeout: 4000,
    maxToasts: 4,
    transition: {
        enter: "fade-enter-active",
        leave: "fade-leave-active",
        move: "fade-move"
    }
});
app.mount('#app');
