import { comparePassword } from '../../shared/utils/hashing.js';

export default class AuthService {
    constructor(authRepository) {
        this.authRepository = authRepository;
    }

    async login(email, password) {
        try {
            const user = await this.authRepository.findByEmail(email);

            if (!user) {
                throw new Error('User not found.');
            }

            const matchingPasswords = await comparePassword(password, user.password_hash);
            if (!matchingPasswords) {
                throw new Error('Provided password is incorrect.');
            }
            return user;
        } catch (error) {
            throw new Error('Service error:' + error);
        }
    }
}
