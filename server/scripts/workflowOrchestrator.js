import { login, logout } from './authScripts.js';
import { getAccountBalances, getBTCBalance } from './accountScripts.js';
import {
    getAllCryptocurrencies,
    getCryptocurrencyById,
    createCryptocurrency,
    updateCryptocurrency,
    deleteCryptocurrency,
    searchCryptocurrencyBySymbol,
    searchCryptocurrencyByName,
    getCryptocurrencyStats,
} from './cryptoScripts.js';

async function runGetAccountBalanceWorkflow() {
    console.log('Starting: Get Account Balance Workflow...');
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const balanceResponse = await getAccountBalances();
        console.log('Account balances:', JSON.stringify(balanceResponse, null, 2));

        const btcusdtResponse = await getBTCBalance();
        console.log('BTCUSDT balance:', JSON.stringify(btcusdtResponse, null, 2));

        console.log('Workflow completed successfully.');
        return balanceResponse; // Or whatever final result is relevant
    } catch (error) {
        console.error('Workflow failed:', error);
        // Decide if you want to throw the error further or handle it here
        throw error; // Rethrowing to ensure npm script shows failure
    }
}

async function runGetAllCryptocurrenciesWorkflow() {
    console.log('Starting: Get All Cryptocurrencies Workflow...');
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const cryptosResponse = await getAllCryptocurrencies();
        console.log('All cryptocurrencies:', JSON.stringify(cryptosResponse, null, 2));

        console.log('Workflow completed successfully.');
        return cryptosResponse;
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

async function runGetCryptocurrencyByIdWorkflow(id = 1) {
    console.log(`Starting: Get Cryptocurrency by ID (${id}) Workflow...`);
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const cryptoResponse = await getCryptocurrencyById(id);
        console.log(`Cryptocurrency ${id}:`, JSON.stringify(cryptoResponse, null, 2));

        console.log('Workflow completed successfully.');
        return cryptoResponse;
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

async function runCreateCryptocurrencyWorkflow(cryptoData) {
    console.log('Starting: Create Cryptocurrency Workflow...');
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const createResponse = await createCryptocurrency(cryptoData);
        console.log('Created cryptocurrency:', JSON.stringify(createResponse, null, 2));

        console.log('Workflow completed successfully.');
        return createResponse;
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

async function runUpdateCryptocurrencyWorkflow(id, updateData) {
    console.log(`Starting: Update Cryptocurrency (${id}) Workflow...`);
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const updateResponse = await updateCryptocurrency(id, updateData);
        console.log('Updated cryptocurrency:', JSON.stringify(updateResponse, null, 2));

        console.log('Workflow completed successfully.');
        return updateResponse;
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

async function runDeleteCryptocurrencyWorkflow(id) {
    console.log(`Starting: Delete Cryptocurrency (${id}) Workflow...`);
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const deleteResponse = await deleteCryptocurrency(id);
        console.log('Deleted cryptocurrency:', JSON.stringify(deleteResponse, null, 2));

        console.log('Workflow completed successfully.');
        return deleteResponse;
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

async function runSearchCryptocurrencyWorkflow(searchTerm, searchType = 'symbol') {
    console.log(`Starting: Search Cryptocurrency by ${searchType} (${searchTerm}) Workflow...`);
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        let searchResponse;
        if (searchType === 'name') {
            searchResponse = await searchCryptocurrencyByName(searchTerm);
        } else {
            searchResponse = await searchCryptocurrencyBySymbol(searchTerm);
        }
        console.log('Search results:', JSON.stringify(searchResponse, null, 2));

        console.log('Workflow completed successfully.');
        return searchResponse;
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

async function runGetCryptocurrencyStatsWorkflow() {
    console.log('Starting: Get Cryptocurrency Statistics Workflow...');
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        const statsResponse = await getCryptocurrencyStats();
        console.log('Cryptocurrency statistics:', JSON.stringify(statsResponse, null, 2));

        console.log('Workflow completed successfully.');
        return statsResponse;
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

async function runCryptocurrencyDemoWorkflow() {
    console.log('Starting: Cryptocurrency Demo Workflow...');
    try {
        const loginResponse = await login();
        console.log('Login successful:', loginResponse);

        // 1. Get all cryptocurrencies
        console.log('\n--- Getting all cryptocurrencies ---');
        const allCryptos = await getAllCryptocurrencies();
        console.log('All cryptocurrencies:', JSON.stringify(allCryptos, null, 2));

        // Generate a unique symbol to avoid constraint violations
        const timestamp = Date.now();
        const uniqueSymbol = `DEMO${timestamp}`;

        // 2. Create a new cryptocurrency
        console.log('\n--- Creating a new cryptocurrency ---');
        const newCrypto = {
            symbol: uniqueSymbol,
            name: `Demo Coin ${timestamp}`,
            description: 'A demonstration cryptocurrency created by the automation script',
            icon_url: 'https://example.com/demo-coin-icon.png',
        };

        let createResponse;
        let createdId;

        try {
            createResponse = await createCryptocurrency(newCrypto);
            console.log('Created cryptocurrency:', JSON.stringify(createResponse, null, 2));
            createdId = createResponse.data.cryptocurrency_id;
        } catch (error) {
            console.log('Create failed (possibly due to unique constraint):', error);
            // Try to find an existing cryptocurrency to use for the demo
            if (allCryptos.data && allCryptos.data.length > 0) {
                createdId = allCryptos.data[0].cryptocurrency_id;
                console.log(`Using existing cryptocurrency with ID ${createdId} for demo`);
            } else {
                throw new Error('No cryptocurrencies available for demo and creation failed');
            }
        }

        // 3. Get the cryptocurrency by ID
        console.log('\n--- Getting cryptocurrency by ID ---');
        const getByIdResponse = await getCryptocurrencyById(createdId);
        console.log('Retrieved cryptocurrency:', JSON.stringify(getByIdResponse, null, 2));

        // 4. Update the cryptocurrency
        console.log('\n--- Updating cryptocurrency ---');
        const updateData = {
            description: 'Updated description for demo cryptocurrency',
            icon_url: 'https://example.com/updated-demo-coin-icon.png',
        };
        const updateResponse = await updateCryptocurrency(createdId, updateData);
        console.log('Updated cryptocurrency:', JSON.stringify(updateResponse, null, 2));

        // 5. Search for cryptocurrencies by symbol
        console.log('\n--- Searching cryptocurrencies by symbol ---');
        const searchSymbol = createResponse ? uniqueSymbol : getByIdResponse.data.symbol;
        const searchResponse = await searchCryptocurrencyBySymbol(searchSymbol);
        console.log('Search results:', JSON.stringify(searchResponse, null, 2));

        // 6. Search for cryptocurrencies by name
        console.log('\n--- Searching cryptocurrencies by name ---');
        const searchName = createResponse ? 'Demo' : getByIdResponse.data.name.split(' ')[0];
        const searchNameResponse = await searchCryptocurrencyByName(searchName);
        console.log('Name search results:', JSON.stringify(searchNameResponse, null, 2));

        // 7. Get statistics
        console.log('\n--- Getting statistics ---');
        const statsResponse = await getCryptocurrencyStats();
        console.log('Statistics:', JSON.stringify(statsResponse, null, 2));

        // 8. Delete the cryptocurrency (only if we created it)
        if (createResponse) {
            console.log('\n--- Deleting cryptocurrency ---');
            const deleteResponse = await deleteCryptocurrency(createdId);
            console.log('Deleted cryptocurrency:', JSON.stringify(deleteResponse, null, 2));
        } else {
            console.log('\n--- Skipping deletion (using existing cryptocurrency) ---');
        }

        console.log('\nDemo workflow completed successfully.');
        return { success: true, message: 'Demo workflow completed' };
    } catch (error) {
        console.error('Demo workflow failed:', error);
        throw error;
    }
}

// Command line argument parsing to select the workflow
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
    switch (command) {
        case 'get-account-balance':
            await runGetAccountBalanceWorkflow();
            break;
        case 'get-all-cryptocurrencies':
            await runGetAllCryptocurrenciesWorkflow();
            break;
        case 'get-cryptocurrency-by-id':
            if (!arg1) {
                console.error('Error: Cryptocurrency ID is required');
                console.log('Usage: node workflowOrchestrator.js get-cryptocurrency-by-id <id>');
                process.exit(1);
            }
            await runGetCryptocurrencyByIdWorkflow(arg1);
            break;
        case 'create-cryptocurrency':
            if (!arg1 || !arg2) {
                console.error('Error: Symbol and name are required');
                console.log(
                    'Usage: node workflowOrchestrator.js create-cryptocurrency <symbol> <name> [description] [icon_url]'
                );
                process.exit(1);
            }
            const cryptoData = {
                symbol: arg1,
                name: arg2,
                description: process.argv[5] || null,
                icon_url: process.argv[6] || null,
            };
            await runCreateCryptocurrencyWorkflow(cryptoData);
            break;
        case 'update-cryptocurrency':
            if (!arg1) {
                console.error('Error: Cryptocurrency ID is required');
                console.log(
                    'Usage: node workflowOrchestrator.js update-cryptocurrency <id> <field:value> [field:value]...'
                );
                console.log(
                    'Example: node workflowOrchestrator.js update-cryptocurrency 1 description:"New description" icon_url:"https://example.com/icon.png"'
                );
                process.exit(1);
            }
            const updateData = {};
            for (let i = 4; i < process.argv.length; i++) {
                const [field, value] = process.argv[i].split(':');
                if (field && value) {
                    updateData[field] = value;
                }
            }
            if (Object.keys(updateData).length === 0) {
                console.error('Error: At least one field:value pair is required');
                process.exit(1);
            }
            await runUpdateCryptocurrencyWorkflow(arg1, updateData);
            break;
        case 'delete-cryptocurrency':
            if (!arg1) {
                console.error('Error: Cryptocurrency ID is required');
                console.log('Usage: node workflowOrchestrator.js delete-cryptocurrency <id>');
                process.exit(1);
            }
            await runDeleteCryptocurrencyWorkflow(arg1);
            break;
        case 'search-cryptocurrency':
            if (!arg1) {
                console.error('Error: Search term is required');
                console.log(
                    'Usage: node workflowOrchestrator.js search-cryptocurrency <term> [type]'
                );
                console.log('Type can be "symbol" (default) or "name"');
                process.exit(1);
            }
            const searchType = arg2 || 'symbol';
            await runSearchCryptocurrencyWorkflow(arg1, searchType);
            break;
        case 'get-cryptocurrency-stats':
            await runGetCryptocurrencyStatsWorkflow();
            break;
        case 'crypto-demo':
            await runCryptocurrencyDemoWorkflow();
            break;
        default:
            console.log('Usage: node workflowOrchestrator.js [command] [args...]');
            console.log('\nAvailable commands:');
            console.log(
                '  get-account-balance                                    - Get account balances'
            );
            console.log(
                '  get-all-cryptocurrencies                              - Get all cryptocurrencies'
            );
            console.log(
                '  get-cryptocurrency-by-id <id>                         - Get cryptocurrency by ID'
            );
            console.log(
                '  create-cryptocurrency <symbol> <name> [description] [icon_url] - Create new cryptocurrency'
            );
            console.log(
                '  update-cryptocurrency <id> <field:value> [field:value]...      - Update cryptocurrency'
            );
            console.log(
                '  delete-cryptocurrency <id>                            - Delete cryptocurrency'
            );
            console.log(
                '  search-cryptocurrency <term> [type]                   - Search by symbol (default) or name'
            );
            console.log('  get-cryptocurrency-stats                              - Get statistics');
            console.log(
                '  crypto-demo                                           - Run complete demo workflow'
            );
            process.exit(1);
    }
}

main().catch(() => process.exit(1)); // Ensure script exits with error on unhandled rejection
