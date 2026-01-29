#!/usr/bin/env node

/**
 * Kill Dev Server Script
 * 
 * Kills all Node.js processes that might be running dev servers
 * Safe to run - only kills processes on port 5173 or Vite processes
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function killDevServers() {
    try {
        log('\n🔍 Checking for running dev servers...', colors.blue);

        if (process.platform === 'win32') {
            // Windows: Kill processes using port 5173
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

                    if (pids.size > 0) {
                        log(`Found ${pids.size} process(es) using port 5173`, colors.yellow);

                        for (const pid of pids) {
                            try {
                                await execAsync(`taskkill /F /PID ${pid}`);
                                log(`✅ Killed process ${pid}`, colors.green);
                            } catch (e) {
                                // Process might have already exited
                            }
                        }
                    } else {
                        log('✅ No dev servers running on port 5173', colors.green);
                    }
                } else {
                    log('✅ No dev servers running on port 5173', colors.green);
                }
            } catch (e) {
                // No processes found on port 5173
                log('✅ No dev servers running on port 5173', colors.green);
            }

            // Also kill any Vite processes by name
            try {
                await execAsync('taskkill /F /IM vite.exe 2>nul');
                log('✅ Killed Vite processes', colors.green);
            } catch (e) {
                // No Vite processes running
            }

        } else {
            // Unix-like systems
            try {
                await execAsync('lsof -ti:5173 | xargs kill -9 2>/dev/null || true');
                log('✅ Killed processes on port 5173', colors.green);
            } catch (e) {
                log('✅ No dev servers running on port 5173', colors.green);
            }
        }

        log('\n✅ Dev server cleanup complete!\n', colors.green);
        process.exit(0);

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, colors.red);
        process.exit(1);
    }
}

killDevServers();
