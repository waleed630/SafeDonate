// middleware/demo.js

export const isDemoModeEnabled = () => process.env.DEMO_MODE === "true";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "sara.ahmed@gmail.com" -> "s***@gmail.com" */
export const maskEmail = (email) => {
    const [local, domain] = String(email).split("@");
    return `${local.charAt(0)}***@${domain}`;
};

const maskDeep = (value, ownEmail) => {
    if (typeof value === "string") {
        return EMAIL_PATTERN.test(value) && value.toLowerCase() !== ownEmail ? maskEmail(value) : value;
    }
    if (Array.isArray(value)) return value.map((item) => maskDeep(item, ownEmail));
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, maskDeep(item, ownEmail)]),
        );
    }
    return value;
};

/**
 * The demo admin can browse every admin page, but real people's email addresses
 * (users list, contact messages, donors, fundraisers) are masked in API responses.
 * req.user is set later by `protect`, so the check happens when the response is sent.
 */
export const maskEmailsForDemo = (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (!req.user?.isDemo) return originalJson(body);
        const plain = JSON.parse(JSON.stringify(body ?? null));
        return originalJson(maskDeep(plain, String(req.user.email || "").toLowerCase()));
    };
    next();
};

/**
 * Put after `protect` on routes that would let a shared demo account break the
 * demo for the next visitor (deleting data, sending email, changing the demo profile).
 */
export const blockDemo = (req, res, next) => {
    if (req.user?.isDemo) {
        return res.status(403).json({
            success: false,
            demo: true,
            message: "Demo mode: this action is disabled. Everything else works normally.",
        });
    }
    next();
};
