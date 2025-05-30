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
        console.log(account);

        // transform balance from number to string to adhere to openAPI spec.
        const transformedAccount = transformFinancialFields(account);

        // Return user data in camelCase format (matching OpenAPI User schema)
        return {
            id: transformedAccount.id,
            currencyCode: transformedAccount.currency_code,
            balance: transformedAccount.balance,
            createdAt: transformedAccount.created_at,
            updatedAt: transformedAccount.updated_at,
        };
    }

    async getCryptoHoldingBySymbolAndUserID(userId, symbol) {
        validateCryptoSymbol(symbol);

        // Check if symbol exists
        const crypto = await cryptoService.getCryptocurrencyBySymbol(symbol);
        if (!crypto) throw new Error('Invalid symbol: ' + symbol);

        const holding = await this.accountRepository.findCryptoHolding(userId, symbol);
        // transform balance from number to string to adhere to openAPI spec.
        const transformedHolding = transformBalanceToString(holding);

        return {
            id: transformedHolding.id,
            userId: transformedHolding.user_id,
            cryptocurrencyId: transformedHolding.cryptocurrency_id,
            symbol: transformedHolding.symbol,
            name: transformedHolding.name,
            description: transformedHolding.description,
            iconUrl: transformedHolding.icon_url,
            balance: transformedHolding.balance || '0', // returns zero if holdings is zero = not owned.
            createdAt: holding.created_at, // using original value since transformBalanceToString corrupts date format.
            updatedAt: holding.updated_at, // using original value since transformBalanceToString corrupts date format.
        };
    }

    async getCryptoHoldingsByUserId(id) {
        const holdings = await this.accountRepository.findAllCryptoHoldings(id);
        // Return user data in camelCase format (matching OpenAPI User schema)
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
                balance: transformedHoldings.balance || '0', // returns zero if holdings is zero = not owned.
                createdAt: element.created_at, // using original value since transformBalanceToString corrupts date format.
                updatedAt: element.updated_at, // using original value since transformBalanceToString corrupts date format.
            });
        });
        console.log(await finalArray);

        return await finalArray;
    }
}
