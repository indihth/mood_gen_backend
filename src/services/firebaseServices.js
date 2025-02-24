var admin = require("firebase-admin");

var serviceAccount = require("../config/keys/firebase_key.json");

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
// let firestoreDb;

let firestoreDb = null;
let isInitializing = false;

const initializeFirebaseApp = async () => {
  // prevents multiple initializations
  if (isInitializing) return;

  try {
    isInitializing = true;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firestoreDb = admin.firestore();
    console.log("Firebase app initialized - services");
    isInitializing = false;
    return firestoreDb;
  } catch (error) {
    console.error("Firebase app not initialized:", error.stack);
    isInitializing = false;
    return null;
  }
};

const getFirestoreDb = () => {
  if (!firestoreDb) {
    initializeFirebaseApp();
  }
  return firestoreDb;
};
// const initializeFirebaseApp = () => {
//   try {
//     // app = initializeApp(firebaseConfig);
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });
//     firestoreDb = admin.firestore();
//     console.log("Firebase app initialized");
//     // return app;
//   } catch (error) {
//     console.error("Firebase app not initialized:", error.stack);
//   }
// };

const uploadData = async (data) => {
  //   const data = {
  //     name: "Los Angeles",
  //     state: "CA",
  //     country: "USA",
  //   };
  try {
    // const document = doc(firestoreDb, "users", "testUser");
    // let dataUpdated = await setDoc(document, data);

    // let userId = ;
    const res = await firestoreDb.collection("users").add(data); // let Firestore create a unique ID
    // const res = await firestoreDb.collection("users").doc(userId).set(data); // set a specific ID
    console.log("Document written with ID: ", res.id);
    return res.id;
  } catch (error) {
    console.error("Error adding document:", error.stack);
  }
};

const getSpotifyToken = async (userId) => {
  const userToken = firestoreDb.collection("users").doc(userId);
  const doc = await userToken.get();
  if (!doc.exists) {
    console.log("No such document!");
    return null;
  }
  console.log("Document data:", doc.data());
  return doc.data();
};

const getFirebaseApp = () => app;

module.exports = {
  initializeFirebaseApp,
  uploadData,
  getFirebaseApp,
  getSpotifyToken,
  getFirestoreDb, // Add this export
};
