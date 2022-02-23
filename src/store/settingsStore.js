import bbox from '@turf/bbox';
import firebase from 'firebase/app';
import 'firebase/database';
import { GAME_MODE, SCORE_MODE } from '../constants';
import i18n from '../lang';
import router from '../router';
import { getMaxDistanceBbox } from '../utils';
import * as MutationTypes from './mutation-types';

export class GameSettings {
    constructor(
        _allPanorama = false,
        _timeLimitation = 0,
        _mode = GAME_MODE.CLASSIC,
        _timeAttack = false,
        _zoomControl = true,
        _moveControl = true,
        _panControl = true,
        _countdown = 0,
        _scoreMode = SCORE_MODE.NORMAL,
        _areaParams = null
    ) {
        this.allPanorama = _allPanorama;
        this.time = _timeLimitation;
        this.modeSelected = _mode;
        this.timeAttackSelected = _timeAttack;
        this.zoomControl = _zoomControl;
        this.moveControl = _moveControl;
        this.panControl = _panControl;
        this.countdown = _countdown;
        this.scoreMode = _scoreMode;
        this.areaParams = _areaParams;
    }
}

export default {
    namespaced: true,
    state: () => ({
        //Dialog
        isOpenDialogRoom: false,
        loadRoom: false,
        currentComponent: 'settingsMap',
        singlePlayer: true,

        // ROOM
        room: null,
        roomName: '',
        roomErrorMessage: null,
        isHost: false,
        // SETTINGS
        gameSettings: new GameSettings(),
        players: [],
        name: localStorage.getItem('playerName') || randomAnimal,
        invalidName: false,
        playerId: null,
    }),
    mutations: {
        [MutationTypes.SETTINGS_SET_ROOM](state, roomName) {
            state.room = firebase.database().ref(roomName);
            state.roomName = roomName;
            state.playerId =
                (firebase.auth().currentUser &&
                    firebase.auth().currentUser.uid) ||
                null;
            // Open Modal
            if (!state.isOpenDialogRoom) {
                state.loadRoom = true;
                state.isOpenDialogRoom = true;
            }

            state.room.once('value', (snapshot) => {
                const playerId = (state.playerId =
                    firebase.auth().currentUser.uid);

                const numberOfPlayers = snapshot.child('player').numChildren();
                const name = state.name === '' ? randomAnimal : state.name;

                if (numberOfPlayers === 0) {
                    // Put the tentative player's name into the room node
                    // So that other player can't enter as the first player while the player decide the name and room size
                    state.room.child('player').update(
                        {
                            [`${playerId}/name`]: name,
                            [`${playerId}/isHost`]: true,
                            [`${playerId}/isOnline`]: true,
                        },
                        (error) => {
                            if (!error) {
                                // Put the timestamp the room is created so the expired rooms can be removed by cloud function
                                state.room.update({
                                    createdAt:
                                        firebase.database.ServerValue.TIMESTAMP,
                                });
                                state.loadRoom = false;
                                state.currentComponent = 'settingsMap';
                                state.isHost = true;
                            }
                        }
                    );
                } else {
                    const player = snapshot.child('player').val();
                    if (player && player[playerId]) {
                        state.isHost = player[playerId].isHost || false;
                        state.loadRoom = false;
                        if (state.isHost) {
                            state.currentComponent = 'settingsMap';
                        } else {
                            state.currentComponent = 'playerName';
                        }
                    } else {
                        state.room
                            .child(`player/${playerId}/isOnline`)
                            .onDisconnect()
                            .set(false);

                        // Put other player's tentative name
                        state.room.child(`player`).update(
                            {
                                [`${playerId}/name`]: name,
                                [`${playerId}/isOnline`]: true,
                            },
                            (error) => {
                                if (!error) {
                                    state.loadRoom = false;
                                    state.currentComponent = 'playerName';
                                }
                            }
                        );
                    }
                }
            });
        },
        [MutationTypes.SETTINGS_SET_ROOM_ERROR](state, error) {
            state.roomErrorMessage = error;
        },
        [MutationTypes.SETTINGS_SET_GAME_SETTINGS](state, settings) {
            if (settings.modeSelected) {
                settings.areaParams = null;
            }
            if (settings.areaParams) {
                settings.modeSelected = GAME_MODE.CUSTOM_AREA;
            }

            state.gameSettings = {
                ...state.gameSettings,
                ...settings,
            };
        },
        [MutationTypes.SETTINGS_SET_DIFFICULTY](state, difficulty) {
            state.difficulty = difficulty;
        },
        [MutationTypes.SETTINGS_SET_BBOX](state, bbox) {
            state.bboxObj = bbox;
        },
        [MutationTypes.SETTINGS_SET_OPEN_DIALOG_ROOM](state, open) {
            state.isOpenDialogRoom = open;
        },
        [MutationTypes.SETTINGS_SET_MODE_DIALOG_ROOM](state, singlePlayer) {
            state.singlePlayer = singlePlayer;
            state.currentComponent = singlePlayer ? 'settingsMap' : 'roomName';
        },

        [MutationTypes.SETTINGS_SET_STEP_DIALOG_ROOM](state, step) {
            state.currentComponent = step;
        },
        [MutationTypes.SETTINGS_SET_PLAYER_NAME](state, playerName) {
            state.invalidName = state.players.includes(playerName);
            const playerId = firebase.auth().currentUser.uid;
            if (!state.invalidName) {
                state.name = playerName;
                state.room.child(`player`).update({
                    [`${playerId}/name`]: playerName,
                });
            }
        },
        [MutationTypes.SETTINGS_SET_PLAYERS](state, players) {
            state.players = players;
        },
        [MutationTypes.SETTINGS_RESET](state) {
            state.room = null;
            state.roomName = '';
            state.playerNumber = 0;
            state.roomErrorMessage = null;
            state.players = [];
            state.gameSettings = new GameSettings();
        },
    },

    getters: {
        areasJson(state) {
            return state.areas;
        },
    },

    actions: {
        closeDialogRoom({ commit, dispatch }) {
            commit(MutationTypes.SETTINGS_SET_OPEN_DIALOG_ROOM, false);
            dispatch('setMapLoaded', new Map(), { root: true });
            commit(MutationTypes.SETTINGS_RESET);
        },
        openDialogRoom({ commit }, isSinglePlayer = true) {
            commit(MutationTypes.SETTINGS_SET_MODE_DIALOG_ROOM, isSinglePlayer);
            commit(MutationTypes.SETTINGS_SET_OPEN_DIALOG_ROOM, true);
        },

        searchRoom({ commit, dispatch, state }, roomName) {
            commit(MutationTypes.SETTINGS_SET_MODE_DIALOG_ROOM, false);
            if (roomName == '') {
                commit(
                    MutationTypes.SETTINGS_SET_ROOM_ERROR,
                    i18n.t('DialogRoom.invalidRoomName')
                );
            } else {
                commit(MutationTypes.SETTINGS_SET_ROOM, roomName);
            }

            state.room.on('value', (snapshot) => {
                if (snapshot.child('player').exists())
                    state.players = Object.values(
                        snapshot.child('player').val()
                    ).map((p) => p.name);

                if (
                    state.currentComponent === 'playerName' &&
                    !state.isHost &&
                    snapshot.hasChild('size') &&
                    snapshot.hasChild('streetView')
                ) {
                    dispatch('startGame');
                }
            });
        },
        setSettings({ commit, state, rootState, dispatch }) {
            let difficulty = 2000;
            let bboxObj;
            if (rootState.homeStore.map.geojson) {
                bboxObj = bbox(rootState.homeStore.map.geojson);
                commit(MutationTypes.SETTINGS_SET_BBOX, bboxObj);

                difficulty = getMaxDistanceBbox(bboxObj) / 10;
            }
            commit(MutationTypes.SETTINGS_SET_DIFFICULTY, difficulty);
            if (!state.room) {
                router.push({
                    name: 'street-view',
                    params: {
                        ...state.gameSettings,
                        difficulty,
                        placeGeoJson: rootState.homeStore.map.geojson,
                        bboxObj: bboxObj,
                        ...(rootState.homeStore.map
                            ? { mapDetails: rootState.homeStore.map.details }
                            : undefined),
                    },
                });
                dispatch('closeDialogRoom');
            } else {
                state.room.update(
                    {
                        ...state.gameSettings,
                        timeLimitation: state.gameSettings.time,
                        difficulty,
                        ...(bboxObj && { bboxObj: bboxObj }),
                    },
                    (error) => {
                        if (!error) {
                            commit(
                                MutationTypes.SETTINGS_SET_STEP_DIALOG_ROOM,
                                'playerName'
                            );
                        }
                    }
                );
            }
        },

        setPlayerName({ commit }, playerName) {
            if (playerName === '') {
                commit(MutationTypes.SETTINGS_SET_PLAYER_NAME, randomAnimal);
            } else {
                localStorage.setItem('playerName', playerName);
                commit(MutationTypes.SETTINGS_SET_PLAYER_NAME, playerName);
            }
        },
        startGame({ state, dispatch, rootState }) {
            let gameParams = {};
            if (state.isHost) {
                gameParams = {
                    ...state.gameSettings,
                    difficulty: state.difficulty,
                    placeGeoJson: rootState.homeStore.map.geojson,
                    bboxObj: state.bboxObj,
                    isHost: true,
                };
                // Set flag started
                state.room.update({
                    size: state.players.length,
                    started: true,
                });
                dispatch('startGameMultiplayer', gameParams);
            } else {
                state.room.once('value', (snapshot) => {
                    gameParams = {
                        difficulty: snapshot.child('difficulty').val(),
                        bboxObj: snapshot.child('bboxObj').val(),
                        modeSelected: snapshot.child('modeSelected').val(),
                        timeAttackSelected: snapshot
                            .child('timeAttackSelected')
                            .val(),
                        zoomControl: snapshot.child('zoomControl').val(),
                        moveControl: snapshot.child('moveControl').val(),
                        panControl: snapshot.child('panControl').val(),
                        countdown: snapshot.child('countdown').val(),
                        allPanorama: snapshot.child('allPanorama').val(),
                        scoreMode: snapshot.child('scoreMode').val(),
                        areaParams: snapshot.child('areaParams').val(),
                    };

                    dispatch('startGameMultiplayer', gameParams);
                });
            }
        },
        startGameMultiplayer({ state, rootState, dispatch }, gameParams) {
            // Start the game
            router.push({
                name: 'with-friends',
                params: {
                    ...gameParams,
                    roomName: state.roomName,
                    playerName: state.name,
                    playerId: state.playerId,
                    placeGeoJson: rootState.homeStore.map.geojson,
                    multiplayer: true,
                },
            });

            dispatch('closeDialogRoom', false);
        },
    },
};

const animals = [
    'Aardvark',
    'Albatross',
    'Alligator',
    'Alpaca',
    'Ant',
    'Anteater',
    'Antelope',
    'Ape',
    'Armadillo',
    'Donkey',
    'Baboon',
    'Badger',
    'Barracuda',
    'Bat',
    'Bear',
    'Beaver',
    'Bee',
    'Bison',
    'Boar',
    'Buffalo',
    'Butterfly',
    'Camel',
    'Capybara',
    'Caribou',
    'Cassowary',
    'Cat',
    'Caterpillar',
    'Cattle',
    'Chamois',
    'Cheetah',
    'Chicken',
    'Chimpanzee',
    'Chinchilla',
    'Chough',
    'Clam',
    'Cobra',
    'Cockroach',
    'Cod',
    'Cormorant',
    'Coyote',
    'Crab',
    'Crane',
    'Crocodile',
    'Crow',
    'Curlew',
    'Deer',
    'Dinosaur',
    'Dog',
    'Dogfish',
    'Dolphin',
    'Dotterel',
    'Dove',
    'Dragonfly',
    'Duck',
    'Dugong',
    'Dunlin',
    'Eagle',
    'Echidna',
    'Eel',
    'Eland',
    'Elephant',
    'Elk',
    'Emu',
    'Falcon',
    'Ferret',
    'Finch',
    'Fish',
    'Flamingo',
    'Fly',
    'Fox',
    'Frog',
    'Gaur',
    'Gazelle',
    'Gerbil',
    'Giraffe',
    'Gnat',
    'Gnu',
    'Goat',
    'Goldfinch',
    'Goldfish',
    'Goose',
    'Gorilla',
    'Goshawk',
    'Grasshopper',
    'Grouse',
    'Guanaco',
    'Gull',
    'Hamster',
    'Hare',
    'Hawk',
    'Hedgehog',
    'Heron',
    'Herring',
    'Hippopotamus',
    'Hornet',
    'Horse',
    'Human',
    'Hummingbird',
    'Hyena',
    'Ibex',
    'Ibis',
    'Jackal',
    'Jaguar',
    'Jay',
    'Jellyfish',
    'Kangaroo',
    'Kingfisher',
    'Koala',
    'Kookabura',
    'Kouprey',
    'Kudu',
    'Lapwing',
    'Lark',
    'Lemur',
    'Leopard',
    'Lion',
    'Llama',
    'Lobster',
    'Locust',
    'Loris',
    'Louse',
    'Lyrebird',
    'Magpie',
    'Mallard',
    'Manatee',
    'Mandrill',
    'Mantis',
    'Marten',
    'Meerkat',
    'Mink',
    'Mole',
    'Mongoose',
    'Monkey',
    'Moose',
    'Mosquito',
    'Mouse',
    'Mule',
    'Narwhal',
    'Newt',
    'Nightingale',
    'Octopus',
    'Okapi',
    'Opossum',
    'Oryx',
    'Ostrich',
    'Otter',
    'Owl',
    'Oyster',
    'Panther',
    'Parrot',
    'Partridge',
    'Peafowl',
    'Pelican',
    'Penguin',
    'Pheasant',
    'Pig',
    'Pigeon',
    'Pony',
    'Porcupine',
    'Porpoise',
    'Quail',
    'Quelea',
    'Quetzal',
    'Rabbit',
    'Raccoon',
    'Rail',
    'Ram',
    'Rat',
    'Raven',
    'Red deer',
    'Red panda',
    'Reindeer',
    'Rhinoceros',
    'Rook',
    'Salamander',
    'Salmon',
    'Sand Dollar',
    'Sandpiper',
    'Sardine',
    'Scorpion',
    'Seahorse',
    'Seal',
    'Shark',
    'Sheep',
    'Shrew',
    'Skunk',
    'Snail',
    'Snake',
    'Sparrow',
    'Spider',
    'Spoonbill',
    'Squid',
    'Squirrel',
    'Starling',
    'Stingray',
    'Stinkbug',
    'Stork',
    'Swallow',
    'Swan',
    'Tapir',
    'Tarsier',
    'Termite',
    'Tiger',
    'Toad',
    'Trout',
    'Turkey',
    'Turtle',
    'Viper',
    'Vulture',
    'Wallaby',
    'Walrus',
    'Wasp',
    'Weasel',
    'Whale',
    'Wildcat',
    'Wolf',
    'Wolverine',
    'Wombat',
    'Woodcock',
    'Woodpecker',
    'Worm',
    'Wren',
    'Yak',
    'Zebra',
];

const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
