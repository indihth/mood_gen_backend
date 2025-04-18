// src/services/firebase.service.js
const admin = require("firebase-admin");

class FirebaseService {
  // Low-level Firebase operations
  static async setDocument(collection, docId, data) {
    try {
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
    } catch (error) {
      console.error("Error setting document:", error);
      throw new Error(`Firebase set document failed: ${error.message}`);
    }
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
      throw new Error(
        `Firebase set subcollection document failed: ${error.message}`
      );
    }
  }

  static async updateDocument(collection, docId, data) {
    try {
      const docRef = admin.firestore().collection(collection).doc(docId);
      await docRef.update(data);
      return true;
    } catch (error) {
      console.error("Error updating document:", error);
      throw new Error(`Firebase update document failed: ${error.message}`);
    }
  }

  static async addToDocument(collection, docId, data, field) {
    try {
      // run transaction - ensure read and write operations happen atomically
      //  prevents conflicts if multiple users try update at once
      const docRef = admin.firestore().collection(collection).doc(docId);
      return await admin.firestore().runTransaction(async (transaction) => {
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
      console.error("Error updating document field:", error);
      throw new Error(`Firebase add document field failed: ${error.message}`);
    }
  }

  static async getDocument(collection, docId) {
    try {
      const doc = await admin
        .firestore()
        .collection(collection)
        .doc(docId)
        .get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error("Error getting document:", error);
      throw new Error(`Firebase get document failed: ${error.message}`);
    }
  }

  static async getSubcollectionDocument(
    collection,
    docId,
    subcollection,
    subDocId
  ) {
    try {
      const doc = await admin
        .firestore()
        .collection(collection)
        .doc(docId)
        .collection(subcollection)
        .doc(subDocId)
        .get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error("Error getting subcollection document:", error);
      throw new Error(
        `Firebase get subcollection document failed: ${error.message}`
      );
    }
  }

  // get whole collection
  static async getCollection(collection) {
    try {
      const snapshot = await admin.firestore().collection(collection).get();
      return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error("Error getting collection:", error);
      throw new Error(`Firebase get collection failed: ${error.message}`);
    }
  }

  static async getSubcollection(collection, docId, subcollection) {
    try {
      const snapshot = await admin
        .firestore()
        .collection(collection)
        .doc(docId)
        .collection(subcollection)
        .get();

      // returns an array of documents with id and data
      return snapshot.docs.map((doc) => ({ id: doc.id, tracks: doc.data() }));
    } catch (error) {
      console.error("Error getting subcollection:", error);
      throw new Error(`Firebase get subcollection failed: ${error.message}`);
    }
  }

  static async queryNestedField(collection, field, value) {
    try {
      const snapshot = await admin
        .firestore()
        .collection(collection)
        .where(field, "==", value)
        .get();

      if (snapshot.empty) {
        console.log("No matching documents found.");
        throw new Error("No matching documents found.");
      }

      // returns an array of documents with id and data
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error querying nested field:", error);
      throw new Error(`Firebase query nested field failed: ${error.message}`);
    }
  }

  static async verifyToken(token) {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error("Error verifying token:", error);
      throw new Error(`Firebase verify token failed: ${error.message}`);
    }
  }

  static async getUserEmail(userId) {
    try {
      const user = await admin.auth().getUser(userId);
      return user.email;
    } catch (error) {
      console.error("Error getting user email:", error);
      throw new Error(`Firebase get user email failed: ${error.message}`);
    }
  }
}

module.exports = FirebaseService;
