import axios from '@/plugins/axios';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import * as GmapVue from 'gmap-vue';
import Vue from 'vue';
import VueAxios from 'vue-axios';
import VueClipboard from 'vue-clipboard2';
import App from './App.vue';
import i18n from './lang';
import CountryNamePlugin from './plugins/countryNamePlugin';
import vuetify from './plugins/vuetify';
import router from './router';
import * as Sentry from '@sentry/vue';
import { BrowserTracing } from '@sentry/tracing';
import store from './store';

Vue.use(VueAxios, axios);

Vue.use(CountryNamePlugin);
Vue.use(VueClipboard);

Vue.use(GmapVue, {
    load: {
        key: process.env.VUE_APP_API_KEY,
        language: localStorage.getItem('language'),
    },
});
Vue.config.productionTip = false;

Sentry.init({
    Vue,
    dsn: 'https://a70cbbc9625f4b7aa668a9ef8e1fa665@o389713.ingest.sentry.io/6235729',
    integrations: [
        new BrowserTracing({
            routingInstrumentation: Sentry.vueRouterInstrumentation(router),
            tracingOrigins: ['localhost', 'geo-guess-game.doozy.live', /^\//],
        }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    logErrors: true,
});

const updateSizes = (obj = {}) => {
    obj.width = window.innerWidth;
    obj.height = window.innerHeight;
    document.documentElement.style.setProperty(
        '--global-height',
        window.innerHeight + 'px'
    );
    return obj;
};

Object.defineProperty(Vue.prototype, '$viewport', {
    value: Vue.observable(updateSizes()),
});

window.addEventListener('resize', () => {
    updateSizes(Vue.prototype.$viewport);
});

const firebaseConfig = {
    apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
    authDomain:
        process.env.VUE_APP_FIREBASE_AUTH_DOMAIN ||
        process.env.VUE_APP_FIREBASE_PROJECT_ID + '.firebaseapp.com',
    databaseURL:
        process.env.VUE_APP_FIREBASE_DATABASE_URL ||
        'https://' +
            process.env.VUE_APP_FIREBASE_PROJECT_ID +
            '.firebaseio.com',
    projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
    storageBucket:
        process.env.VUE_APP_STORAGE_BUCKET ||
        process.env.VUE_APP_FIREBASE_PROJECT_ID + '.appspot.com',
    messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VUE_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

new Vue({
    vuetify,
    router,
    i18n,
    store,
    axios,
    render: (h) => h(App),
}).$mount('#app');
