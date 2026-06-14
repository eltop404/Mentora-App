/**
 * Real browser-based face verification using face-api.js (TensorFlow.js).
 * No backend required. Models load from CDN on first use (~2MB).
 */

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
let faceApiLoaded = false;
let faceApiLoading = false;
let faceApi: any = null;

/** Dynamically loads face-api.js from CDN if not yet loaded */
const loadFaceApiScript = (): Promise<void> =>
    new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject('no window');
        if ((window as any).faceapi) return resolve();
        const script = document.createElement('script');
        // Use vladmandic fork which is more up-to-date and matches the MODEL_URL
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
        script.onload = () => {
            console.log('Face-api script loaded successfully');
            resolve();
        };
        script.onerror = () => reject('failed to load face-api.js script');
        document.head.appendChild(script);
    });

/** Load all required neural network models from CDN (runs once) */
export const initFaceApi = async (): Promise<boolean> => {
    if (faceApiLoaded) return true;
    if (faceApiLoading) return false;
    faceApiLoading = true;

    console.log('Initializing Face-api v4...');

    try {
        // Step 1: Load script
        await loadFaceApiScript();
        faceApi = (window as any).faceapi;
        if (!faceApi) throw new Error('faceapi global object not found');

        // Step 2: Load models with timeout
        const loadModelsPromise = Promise.all([
            faceApi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceApi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            faceApi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Model loading timed out (15s)')), 15000)
        );

        await Promise.race([loadModelsPromise, timeoutPromise]);

        console.log('Face-api models loaded successfully');
        faceApiLoaded = true;
        faceApiLoading = false;
        return true;
    } catch (e) {
        console.error('Face-api init failed:', e);
        faceApiLoading = false;
        return false;
    }
};

/** Creates an HTMLImageElement from a data URL and waits for it to load */
const dataUrlToImage = (dataUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });

/**
 * Extracts a 128-d face descriptor from a data URL.
 * Returns null if no face is detected.
 */
export const extractFaceDescriptor = async (
    dataUrl: string
): Promise<Float32Array | null> => {
    if (!faceApiLoaded || !faceApi) return null;
    try {
        const img = await dataUrlToImage(dataUrl);
        const detection = await faceApi
            .detectSingleFace(img, new faceApi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withFaceLandmarks(true)
            .withFaceDescriptor();
        return detection?.descriptor ?? null;
    } catch {
        return null;
    }
};

/**
 * Compares two face descriptors using Euclidean distance.
 * Returns a match result:
 *  - { match: true,  distance, score }  → same person
 *  - { match: false, distance, score }  → different person
 * Distance < 0.55 is considered a match (threshold tuned for Egyptian IDs).
 */
export const compareFaces = (
    desc1: Float32Array,
    desc2: Float32Array
): { match: boolean; distance: number; score: number } => {
    const distance = faceApi.euclideanDistance(desc1, desc2);
    const score = Math.round(Math.max(0, (1 - distance) * 100));
    return { match: distance < 0.55, distance, score };
};
