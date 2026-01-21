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
            secure: creds.secure || false
        });

        // Change to the correct remote directory
        const remotePath = creds.remotePath || '/bmwseals.com/retirefire';
        console.log(`Changing to remote directory: ${remotePath}`);
        await client.cd(remotePath);

        // Upload ray3.html
        const localFile = path.join(__dirname, '../ray3.html');
        console.log(`Uploading ray3.html...`);
        await client.uploadFrom(localFile, 'ray3.html');

        console.log('Deployment successful!');
    } catch (err) {
        console.error('Deployment failed:', err);
    } finally {
        client.close();
    }
}

deploy();
