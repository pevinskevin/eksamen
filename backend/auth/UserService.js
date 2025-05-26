import { comparePassword, hashPassword } from '../util/hashing.js';
import { welcomeNewUser } from '../nodemailer/nodemailer.js';

export default class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new Error('User not found.');
        }

        const matchingPasswords = await comparePassword(password, user.password_hash);
        if (!matchingPasswords) {
            throw new Error('Provided password is incorrect.');
        }
        return user;
    }

    async register(email, password) {
        try {
            const hashedPassword = await hashPassword(password);
            const newUser = await this.userRepository.create(email, hashedPassword);
            await this.userRepository.seedUserFiatAccount(email);
            const sendMail = await welcomeNewUser(email, 'Test-user');
            return newUser;
        } catch (error) {
            throw new Error('register() error:' + error);
        }
    }
}
