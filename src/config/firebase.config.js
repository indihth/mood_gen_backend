const admin = require("firebase-admin");
const serviceAccount = require("./keys/firebase_key.json");

const initializeFirebaseApp = () => {
  try {
    // app = initializeApp(firebaseConfig);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firestoreDb = admin.firestore();
    console.log("Firebase app initialized");
    // return app;
  } catch (error) {
    console.error("Firebase app not initialized:", error.stack);
  }
};

module.exports = { initializeFirebaseApp };
