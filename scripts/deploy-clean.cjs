/* eslint-env node */
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function killDevServers() {
    console.log('\n🛑 Killing any running dev servers...');

    try {
        if (process.platform === 'win32') {
            // Kill processes on port 5173
            try {
                const { stdout } = await execAsync('netstat -ano | findstr :5173');
                if (stdout) {
                    const lines = stdout.split('\n');
                    const pids = new Set();

                    lines.forEach(line => {
                        const match = line.match(/LISTENING\s+(\d+)/);
                        if (match) {
                            pids.add(match[1]);
                        }
                    });

                    for (const pid of pids) {
                        try {
                            await execAsync(`taskkill /F /PID ${pid}`);
                            console.log(`✅ Killed dev server process ${pid}`);
                        } catch (e) {
                            // Process already exited
                        }
                    }
                }
            } catch (e) {
                // No processes on port 5173
            }
        } else {
            // Unix-like systems
            try {
                await execAsync('lsof -ti:5173 | xargs kill -9 2>/dev/null || true');
            } catch (e) {
                // No processes on port 5173
            }
        }
        console.log('✅ Dev server cleanup complete\n');
    } catch (error) {
        console.log('⚠️  Dev server cleanup warning:', error.message);
    }
}

async function deployClean() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        // Kill any running dev servers first
        await killDevServers();

        const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '../.credentials/deploy_creds.json'), 'utf8'));

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

        // Safety check: prevent cleaning root
        if (remotePath === '/' || remotePath.length < 2) {
            throw new Error('Remote path is too short or root. Aborting clean deploy for safety.');
        }

        await client.cd(remotePath);

        // CLEANING STEP
        console.log(`⚠️  CLEANING remote directory: ${remotePath}...`);
        await client.clearWorkingDir();
        console.log(`✅ Remote directory cleaned.`);

        // Upload dist/index.html as index.html
        const localFile = path.join(__dirname, '../dist/index.html');
        console.log(`Uploading dist/index.html to index.html...`);
        await client.uploadFrom(localFile, 'index.html');

        // Upload assets directory
        const assetsDir = path.join(__dirname, '../dist/assets');
        console.log(`Uploading dist/assets to assets/...`);
        await client.ensureDir('assets');
        // ensureDir changes into the directory, but uploadFromDir also handles it? 
        // basic-ftp ensureDir just makes sure it exists and cd's into it?
        // Let's check docs behavior. ensureDir: "Creates a directory and enters it."
        // So we are now in remotePath/assets
        // But uploadFromDir uploads the CONTENTS of localDir to CURRENT remoteDir.

        await client.uploadFromDir(assetsDir, '.');

        console.log('\n✅ Clean Deployment successful!\n');
    } catch (err) {
        console.error('\n❌ Deployment failed:', err);
        process.exit(1);
    } finally {
        client.close();
    }
}

deployClean();
