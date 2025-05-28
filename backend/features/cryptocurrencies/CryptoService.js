export default class CryptoService {
    constructor(cryptoRepository) {
        this.cryptoRepository = cryptoRepository;
    }

    async getAllCryptocurrencies() {
        return await this.cryptoRepository.findAll();
    }

    async getCryptocurrencyById(id) {
        const cryptocurrency = await this.cryptoRepository.findById(id);
        if (!cryptocurrency || cryptocurrency.length === 0) {
            // Consistent error handling: throw an error if not found
            const error = new Error('Cryptocurrency not found');
            error.statusCode = 404; // Custom property for HTTP status
            throw error;
        }
        return cryptocurrency[0]; // findById in repo returns an array
    }

    async getCryptocurrencyBySymbol(symbol) {
        return await this.cryptoRepository.findById(symbol);
    }

    async createCryptocurrency(cryptoData) {
        const { symbol, name } = cryptoData;
        // Basic validation at the service layer
        if (!symbol || !name) {
            const error = new Error('Symbol and name are required fields');
            error.statusCode = 400;
            throw error;
        }

        return await this.cryptoRepository.create(cryptoData);
    }

    async updateCryptocurrency(id, cryptoData) {
        const updatedCrypto = await this.cryptoRepository.update(id, cryptoData);
        if (!updatedCrypto) {
            const error = new Error('Cryptocurrency not found for update');
            error.statusCode = 404;
            throw error;
        }
        return updatedCrypto;
    }

    async deleteCryptocurrency(id) {
        const deletedCrypto = await this.cryptoRepository.deleteById(id);
        if (!deletedCrypto) {
            const error = new Error('Cryptocurrency not found for deletion');
            error.statusCode = 404;
            throw error;
        }
        return deletedCrypto;
    }
}
