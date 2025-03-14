import { Account, ID } from 'appwrite';
import { client } from './appwrite';

const account = new Account(client);

export type User = {
    $id: string;
    email: string;
    name: string;
};

export type Session = {
    $id: string;
    userId: string;
};

export const auth = {
    async createAccount(email: string, password: string, name: string): Promise<User> {
        try {
            const user = await account.create(
                ID.unique(),
                email,
                password,
                name
            );
            return user;
        } catch (error) {
            console.error('Error creating account:', error);
            throw error;
        }
    },

    async createEmailSession(email: string, password: string): Promise<Session> {
        try {
            const session = await account.createEmailSession(email, password);
            return session;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            const user = await account.get();
            return user;
        } catch (error) {
            return null;
        }
    },

    async logout(): Promise<void> {
        try {
            await account.deleteSession('current');
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }
}; 