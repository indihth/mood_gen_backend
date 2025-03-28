// src/services/firebase.service.js
const admin = require("firebase-admin");

class FirebaseService {
  // Low-level Firebase operations
  static async setDocument(collection, docId, data) {
    if (!collection || !data) {
      throw new Error(
        "Missing required parameters: collection and data are required"
      );
    }
    const collectionRef = admin.firestore().collection(collection);
    let docRef;

    if (docId === "") {
      // Let Firebase generate an ID
      docRef = collectionRef.add(data);
    } else {
      // Use the provided ID
      docRef = collectionRef.doc(docId);
      await docRef.set(data);
    }

    // returns the document reference in both cases
    return docRef;
  }

  static async setDocumentInSubcollection(
    collection,
    docId,
    subcollection,
    subDocId,
    data
  ) {
    try {
      if (!collection || !subcollection || !data) {
        throw new Error("Missing required parameters");
      }

      const docRef = admin
        .firestore()
        .collection(collection)
        .doc(docId)
        .collection(subcollection);

      if (subDocId === "") {
        // if no id provided, let Firebase create one
        return await docRef.add(data);
      }
      return await docRef.doc(subDocId).set(data);
    } catch (error) {
      console.error("Error setting document in subcollection:", error);
      throw error; // Re-throw to allow caller to handle the error
    }
  }

  static async updateDocument(collection, docId, data) {
    try {
      const docRef = admin.firestore().collection(collection).doc(docId);
      await docRef.update(data);
      return true;
    } catch (error) {
      console.error("Error adding field to document:", error);
      throw error;
    }
  }
  static async addToDocument(collection, docId, data, field) {
    try {
      // run transaction - ensure read and write operations happen atomically
      //  prevents conflicts if multiple users try update at once
      const docRef = admin.firestore().collection(collection).doc(docId);
      admin.firestore().runTransaction(async (transaction) => {
        // first gets the document to update
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists) {
          throw new Error("Document does not exist");
        }

        // gets the existing data
        const docData = docSnap.data()?.[field] || {};

        // updates the data
        const updatedData = { ...docData, ...data };

        // sets the updated data
        transaction.update(docRef, { [field]: updatedData });

        console.log("Document successfully updated");
        return updatedData;
      });
    } catch (error) {
      console.error("Error updating document:", error);
      return null;
    }
  }

  static async getDocument(collection, docId) {
    const doc = await admin.firestore().collection(collection).doc(docId).get();
    return doc.exists ? doc.data() : null;
  }

  static async getSubcollectionDocument(
    collection,
    docId,
    subcollection,
    subDocId
  ) {
    const doc = await admin
      .firestore()
      .collection(collection)
      .doc(docId)
      .collection(subcollection)
      .doc(subDocId)
      .get();
    return doc.exists ? doc.data() : null;
  }

  // get whole collection
  static async getCollection(collection) {
    const snapshot = await admin.firestore().collection(collection).get();
    return snapshot.docs.map((doc) => doc.data());
  }

  static async getSubcollection(collection, docId, subcollection) {
    const snapshot = await admin
      .firestore()
      .collection(collection)
      .doc(docId)
      .collection(subcollection)
      .get();

    // returns an array of documents with id and data
    return snapshot.docs.map((doc) => ({ id: doc.id, tracks: doc.data() }));
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
      return null;
    }
  }
}

module.exports = FirebaseService;
