import dotenv from 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    //connectionTimeout: 10000,
});

// async..await is not allowed in global scope, must use a wrapper
export async function welcomeNewUser(email, username) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: `"Boo 👻" <${process.env.GMAIL_ADDRESS}>`, // sender address
        to: `${email}, ${process.env.PERSONAL_EMAIL}`, // list of receivers
        subject: `${username} welcome to my website OH MAI GAD!(˶ᵔ ᵕ ᵔ˶)`,
        text: `Hiiiiii OMG WELCOME HAHAHAHA I'M SOOOO HAPPY TO HAVE YOU HERE! ٩(ˊᗜˋ*)و ♡`,
        html: '<b>Hello world?</b>', // html body
    });
}

export async function resetPassword(email, newPassword) {
    const info = await transporter.sendMail({
        from: `"Boo 👻" <${process.env.GMAIL_ADDRESS}>`, // sender address
        to: `${email}, ${process.env.PERSONAL_EMAIL}`, // list of receivers
        subject: `Reset password request!(˶ᵔ ᵕ ᵔ˶)`,
        text: `Here's your new password: ${newPassword} ٩(ˊᗜˋ*)و ♡.
        Please don't forget to change it immediately upon logging in.`,
    });
}
