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

        // Upload dist/index.html as index.html
        // Upload dist/index.html
        const localFile = path.join(__dirname, '../dist/index.html');
        console.log(`Uploading dist/index.html to index.html...`);
        await client.uploadFrom(localFile, 'index.html');

        // Upload assets directory
        const assetsDir = path.join(__dirname, '../dist/assets');
        console.log(`Uploading dist/assets to assets/...`);
        await client.ensureDir('assets');
        // purge old assets? maybe not needed if names are hashed, but good practice to clean up? 
        // basic-ftp clearWorkingDir() might be too aggressive if other stuff is there. 
        // We'll just upload (overwrite).
        await client.uploadFromDir(assetsDir, 'assets');

        console.log('Deployment successful!');
    } catch (err) {
        console.error('Deployment failed:', err);
    } finally {
        client.close();
    }
}

deploy();
