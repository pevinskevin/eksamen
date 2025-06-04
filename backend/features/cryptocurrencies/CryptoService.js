import {
    validateCryptoId,
    CreateCryptocurrencySchema,
    UpdateCryptocurrencySchema,
} from '../../shared/validators/cryptoValidators.js';
import { parse } from 'valibot';
import camelcaseKeys from 'camelcase-keys';

export default class CryptoService {
    constructor(cryptoRepository) {
        this.cryptoRepository = cryptoRepository;
    }

    async getAllCryptocurrencies() {
        const resultArray = await this.cryptoRepository.findAll();

        resultArray.forEach((element) => {
            element.icon_url = element.icon_url || '';
        });

        return camelcaseKeys(resultArray);
    }

    async getCryptocurrencyById(id) {
        validateCryptoId(id);

        const cryptocurrency = await this.cryptoRepository.findById(id);
        if (!cryptocurrency) throw new Error('Cryptocurrency with id ' + id);
        cryptocurrency.icon_url = cryptocurrency.icon_url || '';

        return camelcaseKeys(cryptocurrency);
    }

    async getCryptocurrencyBySymbol(symbol) {
        const result = await this.cryptoRepository.findBySymbol(symbol);
        return camelcaseKeys(result);
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
        return {
            id: createdCryptocurrency.id,
            symbol: createdCryptocurrency.symbol,
            name: createdCryptocurrency.name,
            description: createdCryptocurrency.description || '', // Convert null to empty string for API
            iconUrl: createdCryptocurrency.icon_url || '', // Convert null to empty string for API
            createdAt: createdCryptocurrency.created_at,
            updatedAt: createdCryptocurrency.updated_at,
        };
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
        return {
            id: updatedCryptocurrency.id,
            symbol: updatedCryptocurrency.symbol,
            name: updatedCryptocurrency.name,
            description: updatedCryptocurrency.description || '', // Convert null to empty string for API
            iconUrl: updatedCryptocurrency.icon_url || '', // Convert null to empty string for API
            createdAt: updatedCryptocurrency.created_at,
            updatedAt: updatedCryptocurrency.updated_at,
        };
    }

    async deleteCryptocurrency(id) {
        validateCryptoId(id);
        // Verify cryptocurrency exists before deletion
        const exists = await this.cryptoRepository.findById(id);
        if (!exists) throw new Error('Cryptocurrency ID ' + id);
        return await this.cryptoRepository.deleteById(id);
    }
}
