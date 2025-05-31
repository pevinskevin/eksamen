import { validateCryptoId } from '../../shared/validators/cryptoValidators.js';

export default class CryptoService {
    constructor(cryptoRepository) {
        this.cryptoRepository = cryptoRepository;
    }

    async getAllCryptocurrencies() {
        return await this.cryptoRepository.findAll();
    }

    async getCryptocurrencyById(id) {

        validateCryptoId(id);

        const cryptocurrency = await this.cryptoRepository.findById(id);
        if (!cryptocurrency) throw new Error('Cryptocurrency with id: ' + id);

        return cryptocurrency;
    }

    async getCryptocurrencyBySymbol(symbol) {
        return await this.cryptoRepository.findBySymbol(symbol);
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
