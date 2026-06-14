/**
 * 🗄️ Supabase Storage Service
 * Handles file uploads to Supabase Storage buckets instead of storing base64 in DB.
 * This dramatically reduces database size and improves performance.
 *
 * Buckets (must be created manually in Supabase Dashboard → Storage):
 *  - "content-files"   → PDF attachments for lessons/units (public)
 *  - "thumbnails"      → Thumbnail images for content/courses/booklets (public)
 *  - "chat-files"      → Files sent in private/group chats (public)
 *  - "course-videos"   → Course video files (public)
 */

import { supabase, isSupabaseConnected } from './supabaseClient';

export type StorageBucket = 'content-files' | 'thumbnails' | 'chat-files' | 'course-videos';

export interface UploadResult {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
}

/** Generate a unique file path to avoid collisions */
const generatePath = (bucket: StorageBucket, fileName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${timestamp}_${random}_${safeFileName}`;
};

/**
 * Upload a File object to a Supabase Storage bucket.
 * Returns the public URL on success.
 */
export const uploadFile = async (
    bucket: StorageBucket,
    file: File,
    subfolder?: string
): Promise<UploadResult> => {
    if (!isSupabaseConnected) {
        return { success: false, error: 'Supabase غير متصل' };
    }

    try {
        const basePath = generatePath(bucket, file.name);
        const fullPath = subfolder ? `${subfolder}/${basePath}` : basePath;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fullPath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'application/octet-stream',
            });

        if (error) {
            console.error(`[Storage] Upload error to ${bucket}:`, error.message);
            return { success: false, error: error.message };
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            success: true,
            url: urlData.publicUrl,
            path: data.path,
        };
    } catch (err: any) {
        console.error(`[Storage] Unexpected error:`, err);
        return { success: false, error: err.message || 'خطأ غير معروف' };
    }
};

/**
 * Upload a base64 data URL string as a file to Supabase Storage.
 * Useful for migrating existing base64 content or handling canvas/image exports.
 */
export const uploadBase64 = async (
    bucket: StorageBucket,
    base64DataUrl: string,
    fileName: string,
    subfolder?: string
): Promise<UploadResult> => {
    if (!isSupabaseConnected) {
        return { success: false, error: 'Supabase غير متصل' };
    }

    try {
        // Convert base64 to Blob
        const res = await fetch(base64DataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: blob.type });
        return uploadFile(bucket, file, subfolder);
    } catch (err: any) {
        console.error(`[Storage] base64 upload error:`, err);
        return { success: false, error: err.message || 'فشل تحويل الملف' };
    }
};

/**
 * Delete a file from a Supabase Storage bucket by its path.
 */
export const deleteFile = async (
    bucket: StorageBucket,
    path: string
): Promise<boolean> => {
    if (!isSupabaseConnected) return false;

    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
            console.error(`[Storage] Delete error from ${bucket}:`, error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error(`[Storage] Unexpected delete error:`, err);
        return false;
    }
};

/**
 * Upload multiple files at once. Returns an array of results.
 */
export const uploadMultipleFiles = async (
    bucket: StorageBucket,
    files: File[],
    subfolder?: string,
    onProgress?: (current: number, total: number) => void
): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
        onProgress?.(i + 1, files.length);
        const result = await uploadFile(bucket, files[i], subfolder);
        results.push(result);
    }
    return results;
};

/**
 * Smart upload: tries Supabase Storage first, falls back to base64 if not connected.
 * Returns either a public URL (if Supabase ok) or a base64 string (fallback).
 * Format of returned string: "URL:https://..." or "BASE64:data:..."
 */
export const smartUpload = async (
    bucket: StorageBucket,
    file: File,
    subfolder?: string
): Promise<{ type: 'url' | 'base64'; value: string }> => {
    if (isSupabaseConnected) {
        const result = await uploadFile(bucket, file, subfolder);
        if (result.success && result.url) {
            return { type: 'url', value: result.url };
        }
    }

    // Fallback: convert to base64
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve({ type: 'base64', value: e.target?.result as string });
        };
        reader.readAsDataURL(file);
    });
};

/**
 * Build the storage entry string for Content.files[] array.
 * Format: "filename|||URL_OR_BASE64"
 */
export const buildFileEntry = (fileName: string, urlOrBase64: string): string => {
    return `${fileName}|||${urlOrBase64}`;
};

/**
 * Parse a file entry string.
 * Returns { name, src } where src is either a URL or base64 data URL.
 */
export const parseFileEntry = (entry: string): { name: string; src: string } => {
    const sepIndex = entry.indexOf('|||');
    if (sepIndex === -1) return { name: entry, src: entry };
    return {
        name: entry.substring(0, sepIndex),
        src: entry.substring(sepIndex + 3),
    };
};

/**
 * Check if a source string is an external URL (not base64).
 */
export const isExternalUrl = (src: string): boolean => {
    return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//');
};

/**
 * Check if Supabase Storage buckets are available.
 * Returns true if the storage API is accessible.
 */
export const checkStorageAvailable = async (): Promise<boolean> => {
    if (!isSupabaseConnected) return false;
    try {
        const { data, error } = await supabase.storage.listBuckets();
        return !error && !!data;
    } catch {
        return false;
    }
};

/** Get list of available buckets */
export const listBuckets = async (): Promise<string[]> => {
    if (!isSupabaseConnected) return [];
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error || !data) return [];
        return data.map(b => b.name);
    } catch {
        return [];
    }
};
