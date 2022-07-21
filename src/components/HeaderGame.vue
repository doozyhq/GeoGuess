<template>
    <div>
        <div class="header-game" color="grey darken-4">
            <div v-if="remainingTime != null">
                <span id="countdown-text">{{ countdownText }}</span>
            </div>

            <div class="round-score-container">
                <span class="sub-text">{{ $t('HeaderGame.round') }}: </span>
                <span id="roundLabel" class="main-text">
                    {{ round }} / {{ nbRound }}
                </span>
            </div>
            <div v-if="isDistanceVisible" class="round-score-container">
                <span class="sub-text">{{ $t('HeaderGame.distance') }}: </span>
                <span class="main-text">{{
                    $t('HeaderGame.kmaway', {
                        value: new Intl.NumberFormat($i18n.locale).format(
                            distance / 1000
                        ),
                    })
                }}</span>
            </div>
            <div class="round-points-container">
                <span class="sub-text">{{ $t('HeaderGame.score') }}: </span>
    
                <span class="main-text">{{ points }}</span>
            </div>
            <div class="round-points-container">
                <span class="sub-text">{{ $t('HeaderGame.players') }}: </span>
    
                <span class="main-text">{{ players }}</span>
            </div>
            <div class="round-points-container">
                <span class="sub-text">{{ $t('HeaderGame.position') }}: </span>
    
                <span class="main-text">{{ position }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { getCountdownText } from '@/utils';
import { GAME_MODE } from '../constants';
import { mapState } from 'vuex';
export default {
    props: [
        'distance',
        'points',
        'round',
        'remainingTime',
        'roomName',
        'nbRound',
        'players',
        'startTime',
        'position'
    ],
    data() {
        return {
            timerText: '',
            intervalFunction: null,
        };
    },
    watch: {
    },
    computed: {
        ...mapState({
            streamerMode: (state) => state.homeStore.streamerMode,
        }),
        countdownText() {
            return getCountdownText(this.remainingTime);
        },
        isDistanceVisible() {
            return this.mode !== GAME_MODE.COUNTRY;
        },
    },
    mounted() {
    },
    methods: {
    },
};
</script>

<style scoped lang="scss">
.header-game {
    z-index: 3;
    opacity: 0.8;
    background: #212121;
    display:flex;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 10px;
}

.toolbar-title {
    color: white;
}

.round-score-container {
    padding: 0 10px 0 40px;
}

.round-points-container {
    padding: 0 10px 0 40px;
}

.main-text,
#countdown-text {
    color: white;
}

.sub-text {
    color: #616161;
}
@media (max-width: 555px) {
    .room-name {
        display: none;
    }
    .main-text,
    .sub-text,
    #countdown-text {
        font-size: 14px;
    }

    .round-score-container {
        padding: 0 5%;
        .sub-text {
            display: none;
        }
    }

    .round-points-container {
        padding: 0 5%;
        .sub-text {
            display: none;
        }
    }
}
</style>
