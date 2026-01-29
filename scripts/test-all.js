#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * This script:
 * 1. Starts the Vite dev server
 * 2. Waits for it to be ready
 * 3. Runs all tests (unit + integration + E2E)
 * 4. Shuts down the dev server
 * 5. Reports results and exits with appropriate code
 */

const { spawn } = require('child_process');
const http = require('http');

const DEV_SERVER_URL = 'http://localhost:5173';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

let devServer = null;
let testsPassed = false;

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function checkServerReady() {
    return new Promise((resolve) => {
        http.get(DEV_SERVER_URL, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}

async function waitForServer() {
    log('\n⏳ Waiting for dev server to be ready...', colors.yellow);

    for (let i = 0; i < MAX_RETRIES; i++) {
        const ready = await checkServerReady();
        if (ready) {
            log('✅ Dev server is ready!\n', colors.green);
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        if (i % 5 === 0) process.stdout.write('.');
    }

    log('\n❌ Dev server failed to start within timeout', colors.red);
    return false;
}

function startDevServer() {
    return new Promise((resolve, reject) => {
        log('\n🚀 Starting dev server...', colors.blue);

        devServer = spawn('npm', ['run', 'dev'], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
            detached: false
        });

        let resolved = false;

        devServer.stdout.on('data', (data) => {
            const output = data.toString();
            // Look for Vite ready message
            if (!resolved && (output.includes('ready in') || output.includes('Local:'))) {
                resolved = true;
                setTimeout(() => resolve(), 2000); // Give it 2 more seconds
            }
        });

        devServer.stderr.on('data', (data) => {
            const output = data.toString();
            // Vite outputs to stderr
            if (!resolved && (output.includes('ready in') || output.includes('Local:'))) {
                resolved = true;
                setTimeout(() => resolve(), 2000); // Give it 2 more seconds
            }
        });

        devServer.on('error', (error) => {
            if (!resolved) {
                resolved = true;
                reject(error);
            }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                reject(new Error('Dev server startup timeout'));
            }
        }, 30000);
    });
}

function runTests() {
    return new Promise((resolve) => {
        log('\n🧪 Running all tests (unit + integration + E2E)...\n', colors.blue);

        const testProcess = spawn('npm', ['test'], {
            stdio: 'inherit',
            shell: true
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                log('\n✅ All tests passed!', colors.green);
                testsPassed = true;
                resolve(true);
            } else {
                log('\n❌ Some tests failed!', colors.red);
                testsPassed = false;
                resolve(false);
            }
        });
    });
}

function stopDevServer() {
    return new Promise((resolve) => {
        log('\n🛑 Stopping dev server and cleaning up all Node processes...', colors.yellow);

        // Kill the dev server process tree
        if (process.platform === 'win32') {
            // First kill the specific dev server
            if (devServer) {
                spawn('taskkill', ['/pid', devServer.pid, '/f', '/t'], {
                    stdio: 'ignore'
                });
            }

            // Then kill ALL node.exe and node.js processes to ensure complete cleanup
            setTimeout(() => {
                const killAll = spawn('powershell', [
                    '-Command',
                    'Get-Process -Name node, python -ErrorAction SilentlyContinue | Stop-Process -Force; exit 0'
                ], {
                    stdio: 'ignore'
                });

                killAll.on('close', () => {
                    log('✅ All Node and Python processes terminated\n', colors.green);
                    resolve();
                });

                // Fallback timeout
                setTimeout(() => {
                    log('✅ Dev server cleanup complete\n', colors.green);
                    resolve();
                }, 2000);
            }, 1000);
        } else {
            // Unix-like systems
            if (devServer) {
                devServer.kill('SIGTERM');
            }

            // Kill all node processes
            setTimeout(() => {
                spawn('pkill', ['-9', 'node'], {
                    stdio: 'ignore'
                });

                setTimeout(() => {
                    log('✅ All Node processes terminated\n', colors.green);
                    resolve();
                }, 1000);
            }, 1000);
        }
    });
}

async function main() {
    try {
        log('\n' + '='.repeat(60), colors.bright);
        log('  COMPREHENSIVE TEST SUITE', colors.bright);
        log('='.repeat(60) + '\n', colors.bright);

        // Start dev server
        await startDevServer();

        // Wait for server to be ready
        const serverReady = await waitForServer();
        if (!serverReady) {
            await stopDevServer();
            process.exit(1);
        }

        // Run tests
        await runTests();

        // Stop dev server
        await stopDevServer();

        // Exit with appropriate code
        if (testsPassed) {
            log('='.repeat(60), colors.green);
            log('  ✅ TEST SUITE COMPLETE - ALL TESTS PASSED', colors.green);
            log('='.repeat(60) + '\n', colors.green);
            process.exit(0);
        } else {
            log('='.repeat(60), colors.red);
            log('  ❌ TEST SUITE COMPLETE - SOME TESTS FAILED', colors.red);
            log('='.repeat(60) + '\n', colors.red);
            process.exit(1);
        }
    } catch (error) {
        log(`\n❌ Error: ${error.message}`, colors.red);
        await stopDevServer();
        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
    log('\n\n⚠️  Interrupted by user', colors.yellow);
    await stopDevServer();
    process.exit(130);
});

main();
