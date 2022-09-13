import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import Toast, { POSITION } from "vue-toastification";
import { createRouter, createWebHashHistory } from 'vue-router';
import Page from './components/Page.vue';
import vue3GoogleLogin from 'vue3-google-login';

import "vue-toastification/dist/index.css";

const pinia = createPinia();
const routes = [
    { path: '/:view?', component: Page, props: true },
];
const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

const app = createApp(App);
app.use(pinia);
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
app.use(vue3GoogleLogin, {
    clientId: '348408322067-4t4ks9d03r9gfp84c54kk18l0d0gv1ev.apps.googleusercontent.com'
})
app.mount('#app');
