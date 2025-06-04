import { cryptoService } from '../../shared/factory/factory.js';
import {
    transformFinancialFields,
} from '../../shared/utils/balanceTransformer.js';
import validateCryptoSymbol from '../../shared/validators/cryptoValidators.js';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';

export default class AccountService {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }

    async getFiatAccountByUserID(userId) {
        const account = await this.accountRepository.findFiatAccount(userId);

        // Transform balance from number to string for OpenAPI compliance
        const transformedAccount = transformFinancialFields(account);

        return normaliseForOpenAPI(transformedAccount);
    }

    async getCryptoHoldingByUserIdAndSymbol(userId, symbol) {
        validateCryptoSymbol(symbol);

        // Verify cryptocurrency exists in our system
        const crypto = await cryptoService.getCryptocurrencyBySymbol(symbol);
        if (!crypto) throw new Error('Invalid symbol: ' + symbol);

        const holding = await this.accountRepository.findCryptoHolding(userId, symbol);
        // Transform balance from number to string for OpenAPI compliance
        const transformedHolding = transformFinancialFields(holding);

        return normaliseForOpenAPI(transformedHolding);
    }

    async getCryptoHoldingsByUserId(id) {
        const holdings = await this.accountRepository.findAllCryptoHoldings(id);

        const transformedHoldings = [];
        holdings.forEach((element) => {
            transformedHoldings.push(transformFinancialFields(element));
        });
        console.log(normaliseForOpenAPI(transformedHoldings));

        return normaliseForOpenAPI(transformedHoldings);
    }
}
