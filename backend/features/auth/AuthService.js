import { comparePassword, hashPassword } from '../../shared/utils/hashing.js';
import { welcomeNewUser } from '../../shared/email/nodemailer.js';

export default class AuthService {
    constructor(authRepository) {
        this.authRepository = authRepository;
    }

    async register(firstName, lastName, email, password, repeatPassword) {
        // Validate password match
        if (password !== repeatPassword) {
            throw new Error('Passwords do not match');
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await this.authRepository.create(
            firstName,
            lastName,
            email,
            hashedPassword
        );
        await this.authRepository.seedUserFiatAccount(email);

        // Send welcome email
        await welcomeNewUser(email, firstName);

        // Return user in camelCase format matching OpenAPI
        return {
            id: newUser.user_id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role,
            createdAt: newUser.created_at,
            updatedAt: newUser.updated_at,
        };
    }

    async login(email, password) {
        const user = await this.authRepository.findByEmail(email);

        if (!user) {
            throw new Error('User not found.');
        }

        const matchingPasswords = await comparePassword(password, user.password_hash);
        if (!matchingPasswords) {
            throw new Error('Provided password is incorrect.');
        }

        // Return user in camelCase format matching OpenAPI LoginResponse
        return {
            id: user.user_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
        };
    }
}
