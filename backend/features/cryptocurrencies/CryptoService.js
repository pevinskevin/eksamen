import {
    validateCryptoId,
    CreateCryptocurrencySchema,
    UpdateCryptocurrencySchema,
} from './cryptoValidators.js';
import { parse } from 'valibot';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';

export default class CryptoService {
    constructor(cryptoRepository) {
        this.cryptoRepository = cryptoRepository;
    }

    async getAllCryptocurrencies() {
        const resultArray = await this.cryptoRepository.findAll();

        return normaliseForOpenAPI(resultArray);
    }

    async getCryptocurrencyById(id) {
        validateCryptoId(id);

        const cryptocurrency = await this.cryptoRepository.findById(id);
        if (!cryptocurrency) throw new Error('Cryptocurrency with id ' + id);

        return normaliseForOpenAPI(cryptocurrency);
    }

    async getCryptocurrencyBySymbol(symbol) {
        const result = await this.cryptoRepository.findBySymbol(symbol);
        return normaliseForOpenAPI(result);
    }

    async createCryptocurrency(cryptocurrency) {
        // Validate input data format
        parse(CreateCryptocurrencySchema, cryptocurrency);
        // Normalize symbol to uppercase for consistency
        cryptocurrency.symbol = cryptocurrency.symbol.toUpperCase();
        const { symbol, name, description, iconUrl } = cryptocurrency;
        const createdCryptocurrency = await this.cryptoRepository.create(
            symbol,
            name,
            description,
            iconUrl
        );

        return normaliseForOpenAPI(createdCryptocurrency);
    }

    async updateCryptocurrency(id, cryptocurrency) {
        // Validate ID format
        validateCryptoId(id);

        // Verify cryptocurrency exists
        const exists = await this.cryptoRepository.findById(id);
        if (!exists) throw new Error('Cryptocurrency ID ' + id);

        // Validate update data format
        parse(UpdateCryptocurrencySchema, cryptocurrency);

        const { symbol, name, description, iconUrl } = cryptocurrency;
        // Normalize symbol to uppercase if provided
        if (cryptocurrency.symbol) {
            cryptocurrency.symbol = cryptocurrency.symbol.toUpperCase();
        }
        const updatedCryptocurrency = await this.cryptoRepository.update(
            id,
            symbol,
            name,
            description,
            iconUrl
        );
        return normaliseForOpenAPI(updatedCryptocurrency);
    }

    async deleteCryptocurrency(id) {
        validateCryptoId(id);
        // Verify cryptocurrency exists before deletion
        const exists = await this.cryptoRepository.findById(id);
        if (!exists) throw new Error('Cryptocurrency ID ' + id);

        const deletedCryptocurrency = await this.cryptoRepository.deleteById(id);

        return normaliseForOpenAPI(deletedCryptocurrency);
    }
}
