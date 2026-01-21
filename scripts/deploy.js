const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '../deploy_creds.json'), 'utf8'));

        console.log(`Connecting to ${creds.host}...`);
        await client.access({
            host: creds.host,
            user: creds.user,
            password: creds.password,
            secure: creds.secure
        });

        console.log(`Successfully connected. Ensuring remote directory exists: ${creds.remotePath}`);
        await client.ensureDir(creds.remotePath);

        // Upload everything from dist folder
        console.log('Uploading contents of dist folder...');
        await client.uploadFromDir(path.join(__dirname, '../dist'));

        console.log('Deployment successful!');
    } catch (err) {
        console.error('Deployment failed:', err);
    } finally {
        client.close();
    }
}

deploy();
