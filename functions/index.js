/* eslint-env node */
/* global require */
const admin = require("firebase-admin");

admin.initializeApp();

// Intentionally empty: password reset emails are handled directly by Firebase Auth
// from web/mobile clients via sendPasswordResetEmail(auth, email).
