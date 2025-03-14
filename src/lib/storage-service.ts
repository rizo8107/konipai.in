import { ID, Storage } from 'appwrite';
import { client } from './appwrite';

// Initialize Storage
const storage = new Storage(client);

// Storage bucket ID
export const BUCKET_ID = 'product_images';

export async function uploadImage(file: File): Promise<string> {
    try {
        const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
        );

        // Return the file ID which can be used to construct the preview URL
        return response.$id;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

export function getImagePreviewUrl(fileId: string): string {
    return storage.getFilePreview(BUCKET_ID, fileId).toString();
}

export async function deleteImage(fileId: string): Promise<void> {
    try {
        await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}