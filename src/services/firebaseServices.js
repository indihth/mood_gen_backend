var admin = require("firebase-admin");

var serviceAccount = require("./firebase_key.json");

const { getFirestore } = require("firebase-admin/firestore");

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} = process.env;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

let app;
let firestoreDb;

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

const uploadData = async (data) => {
  //   const data = {
  //     name: "Los Angeles",
  //     state: "CA",
  //     country: "USA",
  //   };
  try {
    // const document = doc(firestoreDb, "users", "testUser");
    // let dataUpdated = await setDoc(document, data);
    let userId = 1;
    const res = await firestoreDb.collection("users").doc(userId).set(data);
    console.log("Document written with ID: ", res.id);
    return res.id;
  } catch (error) {
    console.error("Error adding document:", error.stack);
  }
};

const getSpotifyToken = () => {};

const getFirebaseApp = () => app;

module.exports = {
  initializeFirebaseApp,
  uploadData,
  getFirebaseApp,
};
