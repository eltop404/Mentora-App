const https = require('https');
const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, 'public', 'sounds');

if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
}

// iPhone Ringtone (Using reliable Wikimedia Commons / GitHub raw CDNs or stable generic ringtone fallbacks if exact isn't available)
const iphoneUrl = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';
const whatsappUrl = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

const download = (url, dest) => {
    if (fs.existsSync(dest)) return; // Skip if already there
    https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            return download(res.headers.location, dest);
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close());
    }).on('error', (err) => console.error('Error downloading:', err.message));
};

console.log('Fetching audio tones...');
download(iphoneUrl, path.join(soundsDir, 'iphone_ringtone.mp3'));
download(whatsappUrl, path.join(soundsDir, 'calling_tone.mp3'));
