#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORT = process.env.PORT || 8080;

async function killPortProcess() {
    try {
        console.log(`🔍 Checking for processes using port ${PORT}...`);

        // Find processes using the port
        const { stdout } = await execAsync(`lsof -ti:${PORT}`);

        if (!stdout.trim()) {
            console.log(`✅ Port ${PORT} is free`);
            return;
        }

        const pids = stdout.trim().split('\n');
        console.log(`❌ Found ${pids.length} process(es) using port ${PORT}: ${pids.join(', ')}`);

        // Kill all processes
        for (const pid of pids) {
            try {
                await execAsync(`kill ${pid}`);
                console.log(`✅ Killed process ${pid}`);
            } catch (error) {
                console.log(`⚠️  Could not kill process ${pid}: ${error.message}`);
            }
        }

        // Wait a moment and verify
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
            const { stdout: checkStdout } = await execAsync(`lsof -ti:${PORT}`);
            if (checkStdout.trim()) {
                console.log(`⚠️  Some processes may still be running on port ${PORT}`);
            } else {
                console.log(`✅ Port ${PORT} is now free`);
            }
        } catch {
            console.log(`✅ Port ${PORT} is now free`);
        }
    } catch (error) {
        if (error.code === 1) {
            // lsof returns exit code 1 when no processes found
            console.log(`✅ Port ${PORT} is free`);
        } else {
            console.error('❌ Error checking port:', error.message);
        }
    }
}

killPortProcess();
