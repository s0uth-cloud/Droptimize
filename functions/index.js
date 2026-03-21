/* eslint-env node */
/* global require, process, exports */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();

const resendApiKey = defineSecret("RESEND_API_KEY");

const PROJECT_ID = process.env.GCLOUD_PROJECT || "droptimize-4b6fc";
const DEFAULT_WEB_RESET_BASE_URL = `https://${PROJECT_ID}.web.app/reset-password`;
const EMAIL_FROM = process.env.RESET_EMAIL_FROM || "Droptimize <onboarding@resend.dev>";

const isValidEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const buildCustomResetUrl = (generatedLink, webResetBaseUrl) => {
  const parsed = new URL(generatedLink);
  const oobCode = parsed.searchParams.get("oobCode");
  if (!oobCode) {
    throw new Error("Missing oobCode in generated password reset link.");
  }

  const targetUrl = new URL(webResetBaseUrl);
  targetUrl.searchParams.set("mode", "resetPassword");
  targetUrl.searchParams.set("oobCode", oobCode);
  return targetUrl.toString();
};

const composeHtml = ({ appName, email, resetUrl }) => `
<p>Hello,</p>
<p>Follow this link to reset your ${appName} password for your ${email} account.</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not ask to reset your password, you can ignore this email.</p>
<p>Thanks,</p>
<p>Your ${appName} team</p>
`;

exports.requestPasswordReset = onRequest({ region: "asia-southeast1", cors: true, secrets: [resendApiKey] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
    return;
  }

  const email = (req.body?.email || "").trim().toLowerCase();
  const webResetBaseUrl = req.body?.webResetBaseUrl || process.env.WEB_RESET_BASE_URL || DEFAULT_WEB_RESET_BASE_URL;
  const source = req.body?.source || "unknown";
  console.info("requestPasswordReset invoked", {
    hasEmail: !!email,
    webResetBaseUrl,
    source,
    method: req.method,
  });

  if (!isValidEmail(email)) {
    res.status(400).json({ success: false, error: "A valid email is required." });
    return;
  }

  const resendKey = resendApiKey.value();
  if (!resendKey) {
    res.status(500).json({
      success: false,
      error: "RESEND_API_KEY is not configured in Firebase Functions.",
    });
    return;
  }

  try {
    const actionCodeSettings = {
      url: webResetBaseUrl,
      handleCodeInApp: false,
    };

    const generatedLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    const resetUrl = buildCustomResetUrl(generatedLink, webResetBaseUrl);

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Reset your Droptimize password",
      html: composeHtml({ appName: "Droptimize", email, resetUrl }),
    });

    console.info("requestPasswordReset email sent", {
      to: email,
      source,
      resetHost: new URL(resetUrl).host,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("requestPasswordReset error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send reset email.",
    });
  }
});
