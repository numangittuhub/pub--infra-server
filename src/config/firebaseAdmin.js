// src/config/
import admin from "firebase-admin";

// যদি তুমি Firebase Admin SDK ব্যবহার করতে চাও (অপশনাল কিন্তু ভালো)
if (!admin.apps.length) {
  admin.initializeApp();
}

export default admin;