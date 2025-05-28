import { comparePassword, hashPassword } from '../../shared/utils/hashing.js';
import { welcomeNewUser } from '../../shared/email/nodemailer.js';
import { userDataAndPasswordMatchValidation, loginBusinessRules } from './authValidation.js';
import { parse } from 'valibot';

export default class AuthService {
    constructor(authRepository) {
        this.authRepository = authRepository;
    }

    async register(userData) {
        // First validate the input data
        const validatedData = parse(userDataAndPasswordMatchValidation, userData);

        // Check if user already exists
        const existingUser = await this.authRepository.findByEmail(validatedData.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash the password
        const hashedPassword = await hashPassword(validatedData.password);

        // Create the user
        const newUser = await this.authRepository.create(
            validatedData.firstName,
            validatedData.lastName,
            validatedData.email,
            hashedPassword
        );

        // Seed initial fiat account
        await this.authRepository.seedUserFiatAccount(validatedData.email);

        // Send welcome email
        await welcomeNewUser(validatedData.email);

        // Return user data in camelCase format (matching OpenAPI User schema)
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
        // Validate input
        const validatedData = parse(loginBusinessRules, { email, password });

        // Find user by email
        const user = await this.authRepository.findByEmail(validatedData.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check password
        const isPasswordValid = await comparePassword(validatedData.password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Return user data in camelCase format (matching OpenAPI LoginResponse schema)
        return {
            id: user.user_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
        };
    }

    validateRegisterData(userData) {
        return parse(userDataAndPasswordMatchValidation, userData);
    }
}
