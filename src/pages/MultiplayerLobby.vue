<template>
    <DialogRoom />
</template>

<script>
import DialogRoom from '@/components/dialogroom/DialogRoom';
export default {
    components: {
        DialogRoom,
    },
    props: {

    },
    async mounted() {
    },
};
</script>

<style scoped lang="scss">
.v-application--is-rtl .home-page__traveler-img{
    transform: scaleX(-1)

}
.home-page {
    .demo-alert {
        position: absolute;
        z-index: 1;
        width: 100%;
    }
    background-color: #ded3af;
    .home-page__main {
        position: relative;

        .home-page__main__container {
            font-size: 1.2rem;
            padding: 0;
            margin: 0;
            width: 100%;
            background: url('../assets/home/world.svg');
            background-size: cover;
            background-position: top;
            .home-page__main__layout {
                height: calc(70vh - 100px);
                flex-wrap: nowrap;
                justify-items: end;
                .box {
                    margin: auto;
                    width: 35vw;
                    max-width: 100%;
                }

                .home-page__main__content {
                    min-width: 65%;
                }
                .home-page__traveler-container {
                    height: auto;
                    width: 100%;
                    max-width: 50vw;
                    display: flex;
                    justify-content: flex-start;
                    .home-page__traveler-img {
                        max-width: 30vw;
                        max-height: 60vh;
                    }
                }
            }
        }
        #btnMaps {
            position: absolute;
            margin: auto;
            bottom: 0.4rem;
            left: 0;
            right: 0;
        }
    }
    
}
@media (max-width: 1300px) and (min-width: 600px) {
    .home-page
        .home-page__main
        .home-page__main__container
        .home-page__main__layout
        .box {
        width: 60vw;
    }
}
@media (max-width: 660px) {
    .home-page {
        background-color: #ded3af;
        .home-page__main .home-page__main__container {
            .home-page__main__layout {
                flex-direction: column-reverse;

                .box {
                    width: 90vw;
                }
            }
        }
    }
}


@media (max-height: 550px) {
    .home-page
        .home-page__main
        .home-page__main__container
        .home-page__main__layout
        .box {
        margin: 10vh;
    }

    #btnMaps {
        display: none;
    }
}
</style>
