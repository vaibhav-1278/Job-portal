const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "vaibhavgarad556@gmail.com",
        pass: "vpqt prlr vjzx janu" // Use app password or real password,
    },
});

async function sendOtpMail(Email, otp) {
    const info = await transporter.sendMail({
        from: '"Vaibhav Garad" <vaibhavgarad556@gmail.com>',
        to: Email,
        subject: 'JobHyre | Password Reset OTP',
          text: `
Hello,

You requested to reset your password for JobHyre Account.

Your OTP is: ${otp}

This OTP is valid for 30 seconds.
Please do not share this OTP with anyone.

Regards,
JobHyre Team
        `,
        html: `
            <h3>Password Reset Request</h3>
            <p>Your OTP for password reset is:</p>
            <h2 style="color:green;">${otp}</h2>
            <p>This OTP is valid for 30 seconds.</p>
            <p>Please do not share this OTP with anyone.</p>
        `
    });

    console.log("Message sent:", info.messageId);
}


module.exports = sendOtpMail;


