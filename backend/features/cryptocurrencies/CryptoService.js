import {
    validateCryptoId,
    CreateCryptocurrencySchema,
    UpdateCryptocurrencySchema,
} from '../../shared/validators/cryptoValidators.js';
import { parse } from 'valibot';

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
        if (!cryptocurrency) throw new Error('Cryptocurrency with id ' + id);

        return cryptocurrency;
    }

    async getCryptocurrencyBySymbol(symbol) {
        return await this.cryptoRepository.findBySymbol(symbol);
    }

    async createCryptocurrency(cryptocurrency) {
        // validate data
        parse(CreateCryptocurrencySchema, cryptocurrency);
        cryptocurrency.symbol = cryptocurrency.symbol.toUpperCase(); // covnert to upper-case if not done before submission.
        const createdCryptocurrency = await this.cryptoRepository.create(cryptocurrency);
        return {
            id: createdCryptocurrency.id,
            symbol: createdCryptocurrency.symbol,
            name: createdCryptocurrency.name,
            description: createdCryptocurrency.description || '', // optional field - returns empty string if null
            iconUrl: createdCryptocurrency.icon_url || '', // optional field - returns empty string if null
            createdAt: createdCryptocurrency.created_at,
            updatedAt: createdCryptocurrency.updated_at,
        };
    }

    async updateCryptocurrency(id, cryptocurrency) {
        // validate format
        validateCryptoId(id); //

        //validate id exists in db
        const exists = await this.cryptoRepository.findById(id);
        if (!exists) throw new Error('Cryptocurrency ID ' + id);

        // validate format
        parse(UpdateCryptocurrencySchema, cryptocurrency);

        const { symbol, name, description, iconUrl } = cryptocurrency;
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
            id: updatedCryptocurrency.id, // note to self: req.params are always strings.
            symbol: updatedCryptocurrency.symbol,
            name: updatedCryptocurrency.name,
            description: updatedCryptocurrency.description || '', // optional field - returns empty string if null
            iconUrl: updatedCryptocurrency.icon_url || '', // optional field - returns empty string if null
            createdAt: updatedCryptocurrency.created_at,
            updatedAt: updatedCryptocurrency.updated_at,
        };
    }

    async deleteCryptocurrency(id) {
        validateCryptoId(id); // validate format
        const exists = await this.cryptoRepository.findById(id);
        if (!exists) throw new Error('Cryptocurrency ID ' + id);
        return await this.cryptoRepository.deleteById(id);
    }
}
