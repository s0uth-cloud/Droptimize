/* eslint-env node */
/* global require */
const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp();

const ALLOWED_ORIGINS = new Set([
	"https://droptimize-4b6fc.web.app",
	"https://droptimize-4b6fc.firebaseapp.com",
	"http://localhost:5173",
	"http://localhost:3000",
]);

const NAME_RE = /^[A-Za-z][A-Za-z\s'-]{0,48}$/;

function applyCors(req, res) {
	const origin = req.get("origin");
	if (origin && ALLOWED_ORIGINS.has(origin)) {
		res.set("Access-Control-Allow-Origin", origin);
	}
	res.set("Vary", "Origin");
	res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sanitizeName(value) {
	return String(value || "")
		.replace(/[^A-Za-z\s'-]/g, "")
		.replace(/\s{2,}/g, " ")
		.trim();
}

exports.upsertUserProfile = functions
	.region("asia-southeast1")
	.https.onRequest(async (req, res) => {
		applyCors(req, res);

		if (req.method === "OPTIONS") {
			return res.status(204).send("");
		}

		if (req.method !== "POST") {
			return res.status(405).json({
				error: "method-not-allowed",
				message: "Only POST is allowed.",
			});
		}

		const authHeader = req.get("authorization") || "";
		if (!authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				error: "unauthenticated",
				message: "Missing Authorization bearer token.",
			});
		}

		let decodedToken;
		try {
			const idToken = authHeader.replace("Bearer ", "").trim();
			decodedToken = await admin.auth().verifyIdToken(idToken);
		} catch (_err) {
			return res.status(401).json({
				error: "invalid-token",
				message: "Invalid authentication token.",
			});
		}

		const email = String(req.body?.email || "").trim().toLowerCase();
		const role = String(req.body?.role || "driver").trim().toLowerCase();
		const firstName = sanitizeName(req.body?.firstName);
		const lastName = sanitizeName(req.body?.lastName);

		if (!email || !email.includes("@")) {
			return res.status(400).json({
				error: "invalid-email",
				message: "A valid email is required.",
			});
		}

		if (!NAME_RE.test(firstName) || !NAME_RE.test(lastName)) {
			return res.status(400).json({
				error: "invalid-name",
				message:
					"First and last name must contain letters only (spaces, apostrophes, and hyphens are allowed).",
			});
		}

		if (!["driver", "admin"].includes(role)) {
			return res.status(400).json({
				error: "invalid-role",
				message: "Role must be driver or admin.",
			});
		}

		const uid = decodedToken.uid;
		const fullName = `${firstName} ${lastName}`.trim();
		const payload = {
			uid,
			firstName,
			lastName,
			fullName,
			email,
			role,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		if (role === "driver") {
			Object.assign(payload, {
				photoURL: "",
				location: null,
				speed: 0,
				speedLimit: 0,
				status: "Offline",
				parcelsLeft: 0,
				parcelsDelivered: 0,
				totalTrips: 0,
				accountSetupComplete: false,
				vehicleSetupComplete: false,
			});
		}

		try {
			await admin
				.firestore()
				.collection("users")
				.doc(uid)
				.set(
					{
						...payload,
						createdAt: admin.firestore.FieldValue.serverTimestamp(),
					},
					{ merge: true },
				);

			return res.status(200).json({ success: true });
		} catch (err) {
			functions.logger.error("upsertUserProfile failed", err);
			return res.status(500).json({
				error: "profile-write-failed",
				message: "Failed to create account profile.",
			});
		}
	});

// Backward-compatible password reset endpoint for older deployed web clients.
// Newer clients should call Firebase Auth sendPasswordResetEmail directly.
exports.requestPasswordReset = functions
	.region("asia-southeast1")
	.https.onRequest(async (req, res) => {
		applyCors(req, res);

		if (req.method === "OPTIONS") {
			return res.status(204).send("");
		}

		if (req.method !== "POST") {
			return res.status(405).json({
				error: "method-not-allowed",
				message: "Only POST is allowed.",
			});
		}

		const email = String(req.body?.email || "").trim().toLowerCase();
		if (!email) {
			return res.status(400).json({
				error: "invalid-argument",
				message: "Email is required.",
			});
		}

		const apiKey = functions.config()?.app?.web_api_key;
		if (!apiKey) {
			return res.status(500).json({
				error: "missing-config",
				message: "Missing function config app.web_api_key.",
			});
		}

		const continueUrl =
			String(req.body?.continueUrl || "").trim() ||
			"https://droptimize-4b6fc.web.app/reset-password";

		try {
			const response = await fetch(
				`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						requestType: "PASSWORD_RESET",
						email,
						continueUrl,
					}),
				},
			);

			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				const msg = payload?.error?.message || "Failed to send reset email.";
				return res.status(response.status).json({
					error: "firebase-auth-error",
					message: msg,
				});
			}

			return res.status(200).json({ success: true });
		} catch (err) {
			functions.logger.error("requestPasswordReset failed", err);
			return res.status(500).json({
				error: "internal",
				message: "Failed to process password reset request.",
			});
		}
	});
