import { login, logout } from './authScripts.js';
import { getAccountBalances } from './accountScripts.js';

async function runGetAccountBalanceWorkflow() {
    console.log('Starting: Get Account Balance Workflow...');
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const balanceResponse = await getAccountBalances();
        console.log('Account balances:', balanceResponse);

        const logoutResponse = await logout();
        console.log('Logout successful:', logoutResponse);

        console.log('Workflow completed successfully.');
        return balanceResponse; // Or whatever final result is relevant
    } catch (error) {
        console.error('Workflow failed:', error);
        // Decide if you want to throw the error further or handle it here
        throw error; // Rethrowing to ensure npm script shows failure
    }
}

// Command line argument parsing to select the workflow
const command = process.argv[2];

async function main() {
    switch (command) {
        case 'get-account-balance':
            await runGetAccountBalanceWorkflow();
            break;
        default:
            console.log('Usage: node workflowOrchestrator.js [get-account-balance]');
            process.exit(1); // Exit with an error code for unknown command
    }
}

main().catch(() => process.exit(1)); // Ensure script exits with error on unhandled rejection
