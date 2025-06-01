import { cryptoService } from '../../shared/factory/factory.js';
import {
    transformBalanceToString,
    transformFinancialFields,
} from '../../shared/utils/balanceTransformer.js';
import validateCryptoSymbol from '../../shared/validators/cryptoValidators.js';

export default class AccountService {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }

    async getFiatAccountByUserID(userId) {
        const account = await this.accountRepository.findFiatAccount(userId);

        // Transform balance from number to string for OpenAPI compliance
        const transformedAccount = transformFinancialFields(account);

        // Convert snake_case to camelCase for API response
        return {
            id: transformedAccount.id,
            currencyCode: transformedAccount.currency_code,
            balance: transformedAccount.balance,
            createdAt: transformedAccount.created_at,
            updatedAt: transformedAccount.updated_at,
        };
    }

    async getCryptoHoldingByUserIdAndSymbol(userId, symbol) {
        validateCryptoSymbol(symbol);

        // Verify cryptocurrency exists in our system
        const crypto = await cryptoService.getCryptocurrencyBySymbol(symbol);
        if (!crypto) throw new Error('Invalid symbol: ' + symbol);

        const holding = await this.accountRepository.findCryptoHolding(userId, symbol);
        // Transform balance from number to string for OpenAPI compliance
        const transformedHolding = transformBalanceToString(holding);

        return {
            id: transformedHolding.id,
            userId: transformedHolding.user_id,
            cryptocurrencyId: transformedHolding.cryptocurrency_id,
            symbol: transformedHolding.symbol,
            name: transformedHolding.name,
            description: transformedHolding.description,
            iconUrl: transformedHolding.icon_url,
            balance: transformedHolding.balance || '0', // Default to '0' if user has no holdings
            createdAt: holding.created_at, // Use original - transformer corrupts date format
            updatedAt: holding.updated_at, // Use original - transformer corrupts date format
        };
    }

    async getCryptoHoldingsByUserId(id) {
        const holdings = await this.accountRepository.findAllCryptoHoldings(id);
        // Convert each holding record to API format
        let finalArray = [];
        await holdings.forEach((element) => {
            const transformedHoldings = transformBalanceToString(element);
            finalArray.push({
                id: transformedHoldings.id,
                userId: transformedHoldings.user_id,
                cryptocurrencyId: transformedHoldings.cryptocurrency_id,
                symbol: transformedHoldings.symbol,
                name: transformedHoldings.name,
                description: transformedHoldings.description,
                iconUrl: transformedHoldings.icon_url,
                balance: transformedHoldings.balance || '0', // Default to '0' if user has no holdings
                createdAt: element.created_at, // Use original - transformer corrupts date format
                updatedAt: element.updated_at, // Use original - transformer corrupts date format
            });
        });
        return finalArray;
    }
}
