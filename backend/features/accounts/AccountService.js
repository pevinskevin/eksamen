import { cryptoService } from '../../shared/factory/factory.js';
import { transformBalanceToString } from '../../shared/utils/balanceTransformer.js';

export default class AccountService {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }

    async getFiatAccountByUserID(userId) {
        return await this.accountRepository.findFiatAccount(userId);
    }

    async getCryptoHoldingBySymbolAndUserID(userId, symbol) {
        // Check if symbol exists
        const crypto = await cryptoService.getCryptocurrencyBySymbol(symbol);
        if (!crypto) throw new Error('Invalid symbol: ' + symbol);
        else return await this.accountRepository.findCryptoHolding(userId, symbol);
    }

    async getCryptoHoldingsByUserId(id) {
        return await this.accountRepository.findAllCryptoHoldings(id);
    }
}
