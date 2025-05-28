export default class AccountService {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }

    async getFiatBalanceByUserID(userId) {
        return await this.accountRepository.findFiatBalance(userId);
    }

    async getCryptoBalanceBySymbolAndUserID(userId, symbol) {
        return await this.accountRepository.findCryptoBalance(userId, symbol);
    }

    async getCryptoBalancesByUserId(id) {
        return await this.accountRepository.findAllCryptoBalances(id);
    }
}
