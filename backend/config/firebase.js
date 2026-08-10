const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath) {
      console.warn("[Firebase Admin] WARNING: FIREBASE_SERVICE_ACCOUNT_PATH is not defined. Google login verification will be bypassed (DANGEROUS IN PRODUCTION).");
      return null;
    }

    const absolutePath = path.resolve(__dirname, '..', serviceAccountPath);
    
    if (!fs.existsSync(absolutePath)) {
      console.warn(`[Firebase Admin] WARNING: Service account file not found at ${absolutePath}. Google login verification will be bypassed.`);
      return null;
    }

    const serviceAccount = require(absolutePath);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("[Firebase Admin] Initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
    return null;
  }
};

module.exports = { initializeFirebase, admin };
