import { welcomeNewUser } from '../../nodemailer/nodemailer.js';
import { hashPassword } from '../../util/hashing.js';

export default class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
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
