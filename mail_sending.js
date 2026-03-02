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

// Wrap in an async IIFE so we can use await.
var sendMail = async (candidateEmail, candidateName, jobTitle, companyName) => {
    const info = await transporter.sendMail({
        from: '"Vaibhav Garad" <vaibhavgarad556@gmail.com>',
        to: candidateEmail,
        subject: `Congratulations ${candidateName}! You have been shortlisted for ${jobTitle} at ${companyName}`,
        text: `
Dear ${candidateName},

Congratulations! You have been shortlisted for the position of ${jobTitle}.

Please be prepared for the next steps in the recruitment process. We will contact you soon with the interview schedule and other details.

If you have any questions, feel free to reply to this email.

Best regards,
Vaibhav Garad
        `,
        html: `
<p>Dear <b>${candidateName}</b>,</p>

<p>Congratulations! You have been <b>shortlisted</b> for the position of <b>${jobTitle}</b>.</p>

<p>Please be prepared for the next steps in the recruitment process. We will contact you soon with the interview schedule and other details.</p>

<p>If you have any questions, feel free to reply to this email.</p>

<p>Best regards,<br>Vaibhav Garad</p>
        `
    });

    console.log("Message sent:", info.messageId);
};


module.exports = sendMail;


