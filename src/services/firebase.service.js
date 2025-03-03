// src/services/firebase.service.js
const admin = require("firebase-admin");

class FirebaseService {
  // Low-level Firebase operations
  static async setDocument(collection, docId, data) {
    return admin.firestore().collection(collection).doc(docId).set(data);
  }

  static async updateDocument(collection, docId, data) {
    return admin.firestore().collection(collection).doc(docId).update(data);
  }

  static async getDocument(collection, docId) {
    const doc = await admin.firestore().collection(collection).doc(docId).get();
    return doc.exists ? doc.data() : null;
  }

  static async verifyToken(token) {
    return admin.auth().verifyIdToken(token);
  }

  static async getUserEmail(userId) {
    try {
      const user = await admin.auth().getUser(userId);
      return user.email;
    } catch (error) {
      console.error("Error getting user email:", error);
      return null; // or throw the error, depending on your error handling strategy
    }
  }
}

module.exports = FirebaseService;
