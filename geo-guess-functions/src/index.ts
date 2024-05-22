import { database } from 'firebase-admin';
import * as functions from 'firebase-functions/v2';

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

interface Room {
    createdAt: number;
}

export const deleteoldrooms = functions.scheduler.onSchedule(
    'every 24 hours',
    async () => {
        const db = (await database().ref('rooms').get()).val();

        if (db) {
            const rooms = Object.entries(db);

            rooms.forEach(async ([key, value]) => {
                const roomDate = (value as Room).createdAt;
                const yesterday = Date.now() - 24 * 60 * 60 * 1000;

                if (roomDate < yesterday) {
                    console.log('Deleting room', key);
                    await database().ref(`rooms/${key}`).remove();
                }
            });
        }
    }
);
