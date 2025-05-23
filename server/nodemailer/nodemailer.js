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
async function main(email, username) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: `"Boo 👻" <${process.env.GMAIL_ADDRESS}>`, // sender address
        to: `${email}`, // list of receivers
        subject: `${username} welcome to my website OH MAI GAD!(˶ᵔ ᵕ ᵔ˶)`, // Subject line
        text: `Hiiiiii OMG WELCOME HAHAHAHA I'M SOOOO HAPPY TO HAVE YOU HERE! ٩(ˊᗜˋ*)و ♡`, // plain text body
        html: '<b>Hello world?</b>', // html body
    });

    console.log('Message sent: %s', info.messageId);
}

// main().catch(console.error);

export default main;
