export default class AccountService {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }

    async getFiatBalance(id) {
        const balance = await this.accountRepository.readFiatBalance(id);
        if (!balance) throw new Error('No fiat account registered to user.');
        return balance;
    }

    async getCryptoBalance(id) {
        const balance = await this.accountRepository.readCryptoBalance(id);
        if (!balance) throw new Error('No crypto account registered to user.');
        return balance;
    }

    async getCryptoHoldingBySymbol(userId, symbol) {
        const holding = await this.accountRepository.readCryptoHoldingBySymbol(userId, symbol);

        if (holding === null) {
            throw new Error(`Cryptocurrency with symbol '${symbol}' not found.`);
        }

        if (Array.isArray(holding) && holding.length === 0) {
            throw new Error(`No holdings found for symbol '${symbol}' for this user.`);
        }

        return holding;
    }
}
