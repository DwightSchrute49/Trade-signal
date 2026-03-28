const nodemailer = require("nodemailer");

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function getTemplate(flow, otp) {
  const isReset = flow === "reset";
  const title = isReset ? "Reset Your Password" : "Verify Your Email";
  const subtitle = isReset
    ? "Use this OTP to reset your TradePulse password"
    : "Use this OTP to complete your TradePulse signup";

  return {
    subject: `TradePulse - ${title}`,
    text: `Your OTP code is: ${otp}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;border:1px solid #222;border-radius:16px;padding:40px;color:#e0e0e0;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="margin:8px 0 0;font-size:20px;background:linear-gradient(90deg,#d4a017,#f0c040);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">TradePulse</h1>
        </div>

        <h2 style="text-align:center;color:#fff;font-size:22px;margin-bottom:8px;">${title}</h2>
        <p style="text-align:center;color:#888;font-size:14px;margin-bottom:28px;">${subtitle}</p>

        <div style="text-align:center;background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#f0c040;">${otp}</span>
        </div>

        <p style="text-align:center;color:#666;font-size:12px;">
          This code expires in <strong style="color:#d4a017;">10 minutes</strong>.<br>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };
}

async function main() {
  try {
    const raw = await readStdin();
    const payload = JSON.parse(raw || "{}");
    const to = String(payload.to || "").trim();
    const otp = String(payload.otp || "").trim();
    const flow = String(payload.flow || "signup").trim();

    if (!to || !otp) {
      process.stdout.write(
        JSON.stringify({ ok: false, error: "Missing to or otp" }),
      );
      process.exit(0);
    }

    const smtpEmail = process.env.SMTP_EMAIL || "";
    const smtpPassword = process.env.SMTP_PASSWORD || "";
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 587);

    if (!smtpEmail || !smtpPassword) {
      process.stdout.write(
        JSON.stringify({
          ok: false,
          error: "SMTP_EMAIL/SMTP_PASSWORD not configured",
        }),
      );
      process.exit(0);
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    const tpl = getTemplate(flow, otp);

    await transporter.sendMail({
      from: `TradePulse <${smtpEmail}>`,
      to,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });

    process.stdout.write(JSON.stringify({ ok: true }));
    process.exit(0);
  } catch (err) {
    process.stdout.write(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
    );
    process.exit(0);
  }
}

main();
