export declare class User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    profilePicture: string;
    preferredLanguage: string;
    isEmailVerified: boolean;
    emailVerificationToken: string;
    passwordResetToken: string;
    passwordResetExpires: Date;
    oauth42Id: string;
    googleId: string;
    createdAt: Date;
    updatedAt: Date;
}
