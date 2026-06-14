import fs from 'fs';
import path from 'path';
import https from 'https';

const CALLING_TONE_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
const RINGTONE_URL = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';

const dir = 'public/sounds';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function main() {
    try {
        console.log('Downloading sounds...');
        await download(CALLING_TONE_URL, path.join(dir, 'calling_tone.mp3'));
        await download(RINGTONE_URL, path.join(dir, 'iphone_ringtone.mp3'));
        console.log('Sounds downloaded successfully!');
    } catch (e) {
        console.error('Error downloading sounds:', e);
    }
}

main();
