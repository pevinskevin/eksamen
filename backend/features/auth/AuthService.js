import { comparePassword, hashPassword } from '../../shared/utils/hashing.js';
import { welcomeNewUser } from '../../shared/email/nodemailer.js';
import {
    userDataAndPasswordMatchValidation,
    loginBusinessRules,
    resetPasswordBusinessRules,
} from './authValidation.js';
import { parse } from 'valibot';
import generator from 'generate-password';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';

export default class AuthService {
    constructor(authRepository) {
        this.authRepository = authRepository;
    }

    async register(userData) {
        const validatedData = parse(userDataAndPasswordMatchValidation, userData);

        // Ensure email is not already registered in the system
        const existingUser = await this.authRepository.findByEmail(validatedData.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash password using bcrypt before storing (never store plain text)
        const hashedPassword = await hashPassword(validatedData.password);

        // Create user record in database with hashed password
        const newUser = await this.authRepository.create(
            validatedData.firstName,
            validatedData.lastName,
            validatedData.email,
            hashedPassword
        );

        // Seed initial fiat account with starting balance for trading
        await this.authRepository.seedUserFiatAccount(validatedData.email);

        // Send welcome email to new user (async operation)
        await welcomeNewUser(validatedData.email);

        // Transform database snake_case to API camelCase format
        // Matches OpenAPI User schema for consistent API responses
        return normaliseForOpenAPI(newUser);
    }

    async login(email, password) {
        // Validate email format and password requirements
        const validatedData = parse(loginBusinessRules, { email, password });

        const user = await this.authRepository.findByEmail(validatedData.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await comparePassword(validatedData.password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        delete user.password_hash;
        return normaliseForOpenAPI(user);
    }

    async resetPassword(email) {
        parse(resetPasswordBusinessRules, { email });
        const userExists = await this.authRepository.findByEmail(email);
        if (!userExists) {
            throw new Error('No account registered to email: ' + email);
        }
        const newPassword = generator.generate({ length: 10, numbers: true });
        const newPasswordHash = await hashPassword(newPassword);
        const passwordUpdatedSuccessfully = await this.authRepository.resetPasswordUsingEmail(
            email,
            newPasswordHash
        );
        if (!passwordUpdatedSuccessfully) {
            throw new Error('Failed to update password for email: ' + email);
        } else {
            return { password: newPassword }; // returns the new password so that it can be provided to the user.
        }
    }
}
