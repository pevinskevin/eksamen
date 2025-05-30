import * as v from 'valibot';

export const registerBusinessRules = v.object({
    firstName: v.pipe(
        v.string(),
        v.trim(),
        v.regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters')
    ),

    lastName: v.pipe(
        v.string(),
        v.trim(),
        v.regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters')
    ),

    email: v.pipe(
        v.string(),
        v.trim(),
        v.toLowerCase(),
        v.email('Please enter a valid email address')
    ),

    password: v.pipe(
        v.string(),
        v.regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain uppercase, lowercase, and number'
        )
    ),

    repeatPassword: v.string(),
});

export const userDataAndPasswordMatchValidation = v.pipe(
    registerBusinessRules,
    v.forward(
        v.check((input) => input.password === input.repeatPassword, 'Passwords do not match'),
        ['repeatPassword']
    )
);

export const loginBusinessRules = v.object({
    email: v.pipe(
        v.string(),
        v.trim(),
        v.toLowerCase(),
        v.email('Please enter a valid email address')
    ),

    password: v.string(),
});
