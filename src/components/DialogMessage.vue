<template>
    <v-dialog
        :value="dialogMessage"
        max-width="600"
        persistent
        :fullscreen="$viewport.width < 450"
    >
        <v-card color="#061422">
            <v-card-title>
                <span
                    id="card-title"
                    class="dialog-message__title"
                >{{
                    dialogTitle
                }}</span>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <span>{{ dialogText }}</span>
                </v-container>
            </v-card-text>
            <v-btn v-if="this.showButton === 'classic'" @click="this.onClickButton">{{ buttonText }}</v-btn>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: ['dialogMessage', 'dialogTitle', 'dialogText', 'showButton', 'onClickButton', 'buttonText'],
};
</script>

<style scoped>
span {
    color: #888;
}

#card-title {
    font-size: 16px;
    font-weight: 500;
    opacity: 0.9;
}
</style>
