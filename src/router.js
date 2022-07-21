import HistoryPage from '@/pages/HistoryPage';
import Home from '@/pages/Home';
import MedalsPage from '@/pages/MedalsPage';
import StreetView from '@/pages/StreetView';
import MultiplayerLobby from '@/pages/MultiplayerLobby';
import Vue from 'vue';
import Router from 'vue-router';
import { GAME_MODE } from './constants';

const originalPush = Router.prototype.push;
Router.prototype.push = function push(location) {
    return originalPush.call(this, location).catch((err) => err);
};

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/game/:partyParams',
            name: 'party',
            component: Home,
        },
        {
            path: '/room/:roomName',
            name: 'Room',
            component: Home,
        },
        {
            path: '/history',
            name: 'History',
            component: HistoryPage,
        },
        {
            path: '/medals',
            name: 'Medals',
            component: MedalsPage,
        },
        {
            path: '/street-view/rooms/:roomName',
            name: 'with-friends',
            component: StreetView,
            props: (route) => {
                return {
                    multiplayer: true,
                    ...route.params,
                };
            },
        },
        {
            path: '/street-view/:modeSelected/:time',
            name: 'street-view',
            component: StreetView,
            props: (route) => ({
                multiplayer: false,
                ...route.params,
                time: parseInt(route.params.time, 10),
            }),
            beforeEnter: (to, from, next) => {
                let enterGame = true;
                if (
                    !Object.values(GAME_MODE).includes(to.params.modeSelected)
                ) {
                    enterGame = false;
                }

                if (isNaN(to.params.time) || to.params.time < 0) {
                    enterGame = false;
                }

                if (enterGame) {
                    next();
                } else {
                    next('/');
                }
            },
        },
        {
            path: '/lobby/:roomName',
            name: 'room',
            component: MultiplayerLobby,
            props: (route) => ({
                multiplayer: true,
                ...route.params,
            }),
        },
    ],
});
