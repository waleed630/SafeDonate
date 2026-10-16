// utils/mailer.js
// Render's free plan blocks outbound SMTP, so in production mail goes through
// Brevo's HTTPS API (set BREVO_API_KEY). Locally it falls back to Gmail SMTP.
import nodemailer from "nodemailer";
import logger from "./logger.js";

const brevoApiKey = process.env.BREVO_API_KEY;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
// Must be a sender address verified in Brevo
const fromEmail = process.env.EMAIL_FROM || emailUser;

const smtpTransporter = !brevoApiKey && emailUser && emailPass
    ? nodemailer.createTransport({ service: "gmail", auth: { user: emailUser, pass: emailPass } })
    : null;

export const isEmailConfigured = () => Boolean((brevoApiKey && fromEmail) || smtpTransporter);

if (brevoApiKey) {
    logger.info(`✅ Email via Brevo API (sender: ${fromEmail})`);
} else if (smtpTransporter) {
    smtpTransporter.verify((error) => {
        if (error) logger.error(`❌ Email transporter error: ${error.message}`);
        else logger.info("✅ Email transporter ready");
    });
} else {
    logger.warn("⚠️ Email not configured. Set BREVO_API_KEY (production) or EMAIL_USER/EMAIL_PASS (local).");
}

export const sendMail = async ({ to, subject, html }) => {
    if (brevoApiKey) {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": brevoApiKey, "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({
                sender: { name: "SafeDonate", email: fromEmail },
                to: [{ email: to }],
                subject,
                htmlContent: html,
            }),
        });
        if (!res.ok) {
            throw new Error(`Brevo API ${res.status}: ${await res.text()}`);
        }
        return;
    }

    if (!smtpTransporter) throw new Error("Email service is not configured");
    await smtpTransporter.sendMail({ from: `"SafeDonate" <${emailUser}>`, to, subject, html });
};
