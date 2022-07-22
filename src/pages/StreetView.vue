<template>
    <div id="game-page">
        <div id="street-view-container">
            <HeaderGame
                ref="header"
                :distance="scoreHeader"
                :points="pointsHeader"
                :round="round"
                :room-name="roomName"
                :nb-round="nbRound"
                :remaining-time="remainingTime"
                :mode="mode"
                :start-time="startTime"
                :players="players"
                :position="rank"
            />

            <div id="game-interface">
                <v-overlay :value="!isReady && multiplayer" opacity="1" />
                <div id="street-view" ref="streetView" />


                <div id="game-interface__overlay">
                    <v-tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn class="resetBtn" rounded dark fab 
                                   v-bind="attrs"
                                   v-on="on"
                                   @click="resetLocation" >
                                <v-icon>mdi-crosshairs-gps</v-icon>
                            </v-btn>
                        </template>
                        <span>{{ $t('Maps.reset') }}</span>
                    </v-tooltip>
                    <Maps
                        ref="mapContainer"
                        :random-lat-lng="randomLatLng"
                        :random-feature-properties="randomFeatureProperties"
                        :room-name="roomName"
                        :player-id="playerId"
                        :player-name="playerName"
                        :is-host="isHost"
                        :is-ready="isReady"
                        :round="round"
                        :score="score"
                        :points="points"
                        :difficulty="difficultyData"
                        :time-limitation="timeLimitation"
                        :bbox="bbox"
                        :mode="mode"
                        :area="area"
                        :time-attack="timeAttack"
                        :nb-round="nbRound"
                        :countdown="countdown"
                        :score-mode="scoreMode"
                        :areasGeoJsonUrl="areaParams && areaParams.data.urlArea"
                        :pathKey="
                            areaParams ? areaParams.data.pathKey : 'iso_a2'
                        "
                        :mapDetails="mapDetails"
                        :start-time="startTime"
                        :results="results"
                        @resetLocation="resetLocation"
                        @calculateDistance="updateScore"
                        @showResult="showResult"
                        @goToNextRound="goToNextRound"
                        @finishGame="finishGame"
                    />
                </div>
            </div>
        </div>
        <v-overlay :value="overlay" opacity="0.8" z-index="1" />
        <DialogMessage
            :dialog-message="dialogMessage"
            :dialog-title="dialogTitle"
            :dialog-text="dialogText"
        />
        <div class="alert-container">
            <v-alert
                v-if="isVisibleDialog"
                type="warning"
                dismissible
                class="warning-alert"
            >
                <b>{{ $t('StreetView.nearby.title') }}</b> :
                {{ $t('StreetView.nearby.message') }}
            </v-alert>
            <v-alert
                id="warningCountdown"
                v-model="isVisibleCountdownAlert"
                type="info"
                dismissible
                transition="slide-x-transition"
                prominent
                icon="mdi-clock-fast"
            >
                {{ $tc('StreetView.countdownAlert', timeCountdown) }}
            </v-alert>
        </div>
    </div>
</template>

<script>
import firebase from 'firebase/app';
import 'firebase/database';
import Vue from 'vue';

import HeaderGame from '@/components/HeaderGame';
import Maps from '@/components/Maps';
import DialogMessage from '@/components/DialogMessage';

import {
    getRandomArea,
} from '../utils';

import {  GAME_MODE, SCORE_MODE } from '../constants';
import { mapActions, mapGetters } from 'vuex';
import StreetViewService from '@/plugins/StreetViewService';

export default {
    components: {
        HeaderGame,
        Maps,
        DialogMessage,
    },
    mixins: [],
    props: {
        roomName: {
            default: null,
            type: String,
        },
        // https://developers.google.com/maps/documentation/javascript/reference/street-view-service#StreetViewSource
        allPanorama: {
            default: false,
            type: Boolean,
        },
        // playerNumber: {
        //     default: null,
        //     type: Number,
        // },
        // isHost: {
        //     default: false,
        //     type: Boolean,
        // },
        // playerId: {
        //     type: String,
        //     default: null
        // },
        multiplayer: {
            default: false,
            type: Boolean,
        },
        time: {
            default: 0,
            type: Number,
        },
        difficulty: {
            default: 2000,
            type: Number,
        },
        roundsPredefined: {
            default: null,
            type: Array,
        },
        modeSelected: {
            default: GAME_MODE.CLASSIC,
            type: String,
        },
        panControl: {
            default: true,
            type: Boolean,
        },
        zoomControl: {
            default: true,
            type: Boolean,
        },
        moveControl: {
            default: true,
            type: Boolean,
        },
        timeAttackSelected: {
            default: false,
            type: Boolean,
        },
        countdown: {
            default: 0,
            type: Number,
        },
        scoreMode: {
            default: SCORE_MODE.NORMAL,
            type: String,
        },
        areaParams: {
            type: Object,
        },
        mapDetails:{
            type: Object,
            required: false,
            default: undefined
        }
    },
    data() {
        return {
            area: null,
            results: [],
            randomLatLng: null,
            randomFeatureProperties: null,
            score: 0,
            scoreHeader: 0,
            points: 0,
            rank: 0,
            pointsHeader: 0,
            round: 0,
            streetView: 0,
            timeLimitation: this.time,
            mode: this.modeSelected,
            timeAttack: this.timeAttackSelected,
            nbRound: this.nbRound || this.timeAttackSelected ? 10 : 5,
            remainingTime: null,
            timerInstance:false,
            endTime: null,
            hasTimerStarted: false,
            hasLocationSelected: false,
            overlay: false,
            room: null,
            isReady: false,
            dialogMessage: this.multiplayer,
            dialogTitle: this.$t('StreetView.waitForOtherPlayers'),
            dialogText: '',
            cptNotFoundLocation: 0,
            isVisibleDialog: false,
            panorama: null,
            players: 0,
            playerId: null,
            isHost: false,
            playerName: "",
            startTime: null,
            placeGeoJson: null,
            bboxObj: null,

            difficultyData: this.difficulty,
            bbox: this.bboxObj,
            isVisibleCountdownAlert: false,
            timeCountdown: 0,
            isLoading: true,
            streetViewService: null,
        };
    },
    computed: {
        ...mapGetters(['areasJson']),
    },
    async mounted() {
        if (
            (this.areaParams && this.areaParams.data.urlArea) ||
            this.mode === GAME_MODE.COUNTRY
        ) {
            await this.loadAreas(
                this.areaParams && this.areaParams.data.urlArea
            );
        }
        await this.$gmapApiPromiseLazy();
        this.panorama = new google.maps.StreetViewPanorama(
            this.$refs.streetView
        );

        this.room = firebase.database().ref(`rooms/${this.roomName}`);
        this.room.child('active').set(true);
        this.room.on('value', async (snapshot) => {
            this.playerId = firebase.auth().currentUser && firebase.auth().currentUser.uid || null;

            if (this.playerId && snapshot.child('player').child(this.playerId).exists()) {
                this.isHost = snapshot.child('player').child(this.playerId).val().isHost || false;
                this.playerName = snapshot.child('player').child(this.playerId).val().name || false;

                snapshot.ref.child('player').child(this.playerId).child('isOnline').onDisconnect().set(false).then(() => {
                    snapshot.ref.child('player').child(this.playerId).child('isOnline').set(true);
                });
            } else {
                this.isHost = false;
                this.playerName = null;
            }

            if (!this.placeGeoJson && snapshot.child("placeGeoJson").exists()) {
                this.placeGeoJson = JSON.parse(snapshot.child("placeGeoJson").val());
            }

            this.difficultyData = snapshot.child('difficulty').val() || this.difficultyData;

            if (!this.streetViewService) {
                this.streetViewService = new StreetViewService(
                    { allPanorama: this.allPanorama, optimiseStreetView: this.optimiseStreetView },
                    { mode: this.mode, areaParams: this.areaParams, areasJson: this.areasJson },
                    this.placeGeoJson,
                    this.roundsPredefined
                );
            }

            if (!this.bboxObj && !snapshot.child("bboxObj").exists()) {
                this.bboxObj = JSON.parse(snapshot.child("bboxObj").val());
                this.bbox = this.bboxObj;
            }


            this.isLoading = false; 
            if (snapshot.child("nbRound").exists()) {
                this.nbRound = snapshot.child("nbRound").val();
            }

            // Check if the room is already removed
            if (snapshot.hasChild('active')) {
                let isNewRound = false;
                if (!snapshot.child("round").exists()) {
                    this.round = snapshot.child("round").val() || 1;
                    snapshot.ref.child("round").set(1);
                    isNewRound = true;
                } else {
                    isNewRound = this.round !== snapshot.child("round").val();
                    this.round = snapshot.child("round").val();
                }

                this.players = Object.values(snapshot.child("player").val()).filter(t => t.isOnline).length;
                // Put the player into the current round node if the player is not put yet
                if (
                    !snapshot
                        .child('round' + this.round)
                        .hasChild(this.playerId)
                ) {
                    await this.room
                        .child('round' + this.round)
                        .child(this.playerId)
                        .set(0);
                }
                
                if (snapshot.child('startTime').exists()) {
                    this.startTime = new Date(snapshot.child('startTime').val());
                }

                // Load the streetview when it's ready
                if (snapshot.child(`streetView/round${this.round}`).exists() && this.round !== this.streetView) {
                    this.startNextRound();
                    this.hasLocationSelected = snapshot.child(`round${this.round}`).child(this.playerId).exists() && snapshot.child(`round${this.round}`).child(this.playerId).val() !== 0;

                    this.randomLat = snapshot
                        .child(
                            'streetView/round' +
                                this.round +
                                '/latitude'
                        )
                        .val();
                    this.randomLng = snapshot
                        .child(
                            'streetView/round' +
                                this.round +
                                '/longitude'
                        )
                        .val();
                    this.randomLatLng = new google.maps.LatLng(
                        this.randomLat,
                        this.randomLng
                    );
                    this.area = snapshot
                        .child(
                            'streetView/round' + this.round + '/area'
                        )
                        .val();
                    this.isVisibleDialog = snapshot
                        .child(
                            'streetView/round' + this.round + '/warning'
                        )
                        .val();
                    this.randomFeatureProperties = snapshot
                        .child(
                            'streetView/round' +
                                this.round +
                                '/roundInfo'
                        )
                        .val();
                        
                    this.streetView = this.round;
                    // Countdown timer starts
                    this.timeLimitation = snapshot
                        .child('timeLimitation')
                        .val();

                    debugger;
                    if (this.timeLimitation) {
                        if (!this.hasTimerStarted) {
                            this.initTimer(this.timeLimitation, this.startTime);
                            this.hasTimerStarted = true;
                        }
                    }
                    this.resetLocation();
                }


                if (this.isHost && !snapshot.child("streetView").child('round' + this.round).exists() && isNewRound) {
                    this.loadStreetView();
                } 
                
            } else {
                // Force the players to exit the game when 'Active' is removed
                // this.exitGame();
            }

            // Show summary button
            let results = [];
            
            snapshot
                .child('finalPoints')
                .forEach((childSnapshot) => {
                    const playerName = snapshot
                        .child('player')
                        .child(childSnapshot.key)
                        .val().name;
                    const finalScore = snapshot
                        .child('finalScore')
                        .child(childSnapshot.key)
                        .val();
                    const finalPoints = childSnapshot.val();
                    results.push({
                        playerId: childSnapshot.key,
                        playerName: playerName,
                        finalScore: finalScore,
                        finalPoints: finalPoints,
                    });
                });

            results = results.sort(
                (a, b) =>
                    parseInt(b.finalPoints) -
                    parseInt(a.finalPoints)
            );
            this.results = results;
            this.rank = results.findIndex(
                (r) => r.playerId === this.playerId
            ) + 1;
        });
    },
    beforeDestroy() {
        if (document.querySelector('.widget-scene')) {
            document
                .querySelector('.widget-scene')
                .removeEventListener('keydown', this.onUserEventPanoramaKey);

            document
                .querySelector('.widget-scene')
                .removeEventListener(
                    'mousedown',
                    this.onUserEventPanoramaMouse
                );
        }
        if (this.room) {
            // Remove the room when the player refreshes the window
            // Remove the room when the player pressed the back button on browser
            this.room.child('active').remove();
            this.room.off();
        }
    },
    methods: {
        ...mapActions(['loadAreas']),
        async loadStreetView() {
            let {panorama, roundInfo, warning, area} = await this.streetViewService.getStreetView(this.round);
            this.randomLatLng = panorama.location.latLng;
            this.randomFeatureProperties = roundInfo;
            this.area = area;
            this.setPosition(panorama);

            // Put the streetview's location into firebasest
            this.room.child('startTime').set(Date.now());
            this.room
                .child('streetView/round' + this.round)
                .set({
                    latitude: this.randomLatLng.lat(),
                    longitude: this.randomLatLng.lng(),
                    roundInfo: roundInfo,
                    ...(area && {area}),
                    warning,
                });

        },
        resetLocation() {
            const service = new google.maps.StreetViewService();
            service.getPanorama(
                {
                    location: this.randomLatLng,
                    preference: 'nearest',
                    radius: 50,
                    source: this.allPanorama ? 'default' : 'outdoor',
                },
                this.setPosition
            );
        },
        setPosition(data) {
            this.panorama.setOptions({
                addressControl: false,
                fullscreenControl: false,
                motionTracking: false,
                motionTrackingControl: false,
                showRoadLabels: false,
                panControl: this.panControl,
                zoomControl: this.zoomControl,
                scrollwheel: this.zoomControl,
                disableDoubleClickZoom: !this.zoomControl,
                linksControl: this.moveControl,
                clickToGo: this.moveControl,
            });
            // Remove google streetview link
            if (document.querySelector('#street-view a[href^="https://maps"]'))
                document
                    .querySelector('#street-view a[href^="https://maps"]')
                    .remove();
            setTimeout(() => {
                if (document.querySelector('.widget-scene')) {
                    document
                        .querySelector('.widget-scene')
                        .addEventListener(
                            'keydown',
                            this.onUserEventPanoramaKey
                        );
                    document
                        .querySelector('.widget-scene')
                        .addEventListener(
                            'mousedown',
                            this.onUserEventPanoramaMouse
                        );
                    document
                        .querySelector('.widget-scene')
                        .addEventListener(
                            'touchstart',
                            this.onUserEventPanoramaMouse
                        );
                    document
                        .querySelector('.widget-scene')
                        .addEventListener(
                            'pointerdown',
                            this.onUserEventPanoramaMouse
                        );
                }
            }, 50);
            if(data && data.location)
                this.panorama.setPano(data.location.pano);
            this.panorama.setPov({
                heading: 270,
                pitch: 0,
            });
            this.panorama.setZoom(0);
        },
        initTimer(time, endDate, printAlert) {
            debugger;
            endDate.setSeconds(endDate.getSeconds() + time);
            if (printAlert) {
                this.timeCountdown = time;
                this.isVisibleCountdownAlert = true;
            }
            if (this.hasTimerStarted) {
                this.endTime = this.endTime > endDate ? endDate : this.endTime;
            } else {
                this.endTime = endDate;
                this.startTimer();
            }
        },
        startTimer(round = this.round) {
            if (round === this.round) {
                this.stopTimer();
                this.remainingTime = Math.max(
                    0,
                    Math.round((this.endTime - Date.now()) / 1000)
                );
                
                this.timerInstance = setInterval(() => {
                    if (this.remainingTime > 0) {
                        this.remainingTime = Math.max(
                            0,
                            Math.round((this.endTime - Date.now()) / 1000)
                        );
                    } else {
                        this.stopTimer(); 
                        
                        if (!this.hasLocationSelected) {
                            if (
                                [GAME_MODE.COUNTRY, GAME_MODE.CUSTOM_AREA].includes(
                                    this.mode
                                )
                            ) {
                                this.$refs.mapContainer.selectRandomLocation(
                                    getRandomArea(
                                        this.areasJson,
                                        this.areaParams
                                            ? this.areaParams.data.pathKey
                                            : 'iso_a2'
                                    )
                                );
                            } else {
                                // Set a random location if the player didn't select a location in time
                                this.$refs.mapContainer.selectRandomLocation(
                                    this.streetViewService.getRandomLatLng().position
                                );
                            }
                        }
                    }
                }, 1000);
            }
        },
        stopTimer(round = this.round) {
            if (round === this.round && this.timerInstance) {
                clearInterval(this.timerInstance);
            }
        },
        updateScore(distance, points) {
            // Update the score and save it into firebase
            this.hasLocationSelected = true;
            this.score += distance;
            this.points += points;

            this.room
                .child(`finalScore/${this.playerId}`)
                .set(this.score);
            this.room
                .child(`finalPoints/${this.playerId}`)
                .set(this.points);

            // Wait for other players to guess locations
            this.dialogTitle = this.$t('StreetView.waitForOtherPlayers');
            this.dialogMessage = true;
        },
        showResult() {
            this.scoreHeader = this.score; // Update the score on header after every players guess locations
            this.pointsHeader = this.points;
            this.dialogMessage = false;
            this.isVisibleCountdownAlert = false;
            this.overlay = true;
            this.stopTimer();
        },
        startNextRound(playAgain = false) {
            if (playAgain) {
                this.round = 0;
                this.scoreHeader = 0;
                this.pointsHeader = 0;
                this.score = 0;
                this.points = 0;
            }

            // Reset
            this.randomLatLng = null;
            this.area = null;
            this.overlay = false;
            this.hasTimerStarted = false;
            this.timerInstance = true;
            this.hasLocationSelected = false;
            this.isVisibleDialog = false;
            this.randomFeatureProperties = null;

            this.dialogMessage = false; // Show the dialog while waiting for other players
            this.isReady = true; // Turn off the flag so the click event can be added in the next round
            this.$refs.mapContainer.startNextRound();
        },

        async goToNextRound(roundNumber) {
            if (this.isHost) {
                await this.room.ref.update({"round": roundNumber, nbRound: roundNumber -1 >= this.nbRound ? this.nbRound + 5 : this.nbRound });
            }
        },
        
        exitGame() {
            // Disable the listener and force the players to exit the game
            this.dialogTitle = this.$t('StreetView.redirectToHomePage');
            this.dialogText = this.$t('StreetView.exitGame');
            this.dialogMessage = true;
            this.canExit = true;
        },
        finishGame() {
            this.canExit = true;
            // Open the dialog while waiting for other players to finsih the game
            this.dialogTitle = this.$t(
                'StreetView.waitForOtherPlayersToFinish'
            );
            this.dialogText = '';
            this.dialogMessage = true;

        },
        onUserEventPanoramaKey(e) {
            if (
                (!this.moveControl &&
                    [38, 40, 87, 83, 90].includes(e.keyCode)) ||
                (!this.zoomControl &&
                    [107, 109, 187, 189].includes(e.keyCode)) ||
                (!this.panControl &&
                    [37, 39, 65, 68, 100, 102].includes(e.keyCode))
            ) {
                e.stopPropagation();
            }
        },
        onUserEventPanoramaMouse(e) {
            if (!this.panControl) e.stopPropagation();
        },
    },
};
</script>

<style scoped lang="scss">
#game-page {
    position: relative;
    height: 100%;
    height: var(--global-height, 100%);
    width: 100%;
    top: 0;
    left: 0;
}

#street-view-container {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
}
#game-interface {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;

    &__overlay {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        .resetBtn{
            position: absolute;
            bottom: 22px;
            right: 70px;
            z-index: 1;
            @media (max-width: 450px) {
                bottom: 65px;
            }
        }
    }
}

#street-view {
    position: relative;
    min-height: 100%;
    width: 100%;
}
.alert-container {
    margin-top: 65px;
    .v-alert {
        z-index: 2;
    }
    #warningCountdown {
        width: fit-content;
        margin: 10px;
        margin-top: 90px;
        padding: auto 30px;
    }
}

@media (max-width: 450px) {
    #game-interface {
        display: grid;
        grid-template-rows: auto 44px;
        #game-interface--overlay {
            position: initial;
        }
    }

    #reset-button {
        bottom: 120px;
    }
}
</style>
