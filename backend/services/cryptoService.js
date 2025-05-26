export default class CryptoService {
    constructor(cryptoRepository) {
        this.cryptoRepository = cryptoRepository;
    }

    async getAllCryptocurrencies() {
        try {
            return await this.cryptoRepository.findAll();
        } catch (error) {
            // It's often good practice to log the original error for debugging
            // and then throw a new error or a more specific error for the service layer.
            console.error('Error in CryptoService.getAllCryptocurrencies:', error.message);
            throw new Error('Service error retrieving all cryptocurrencies: ' + error.message);
        }
    }

    async getCryptocurrencyById(id) {
        try {
            const cryptocurrency = await this.cryptoRepository.findById(id);
            if (!cryptocurrency || cryptocurrency.length === 0) {
                // Consistent error handling: throw an error if not found
                const error = new Error('Cryptocurrency not found');
                error.statusCode = 404; // Custom property for HTTP status
                throw error;
            }
            return cryptocurrency[0]; // findById in repo returns an array
        } catch (error) {
            console.error(
                `Error in CryptoService.getCryptocurrencyById for id ${id}:`,
                error.message
            );
            if (error.statusCode) throw error; // Re-throw if it already has a status code
            throw new Error('Service error retrieving cryptocurrency by ID: ' + error.message);
        }
    }

    async createCryptocurrency(cryptoData) {
        const { symbol, name } = cryptoData;
        // Basic validation at the service layer
        if (!symbol || !name) {
            const error = new Error('Symbol and name are required fields');
            error.statusCode = 400;
            throw error;
        }

        try {
            return await this.cryptoRepository.create(cryptoData);
        } catch (error) {
            console.error('Error in CryptoService.createCryptocurrency:', error.message);
            // Check if it's a known repository error or a generic one
            if (error.message.startsWith('Repository error')) {
                const serviceError = new Error(
                    'Failed to create cryptocurrency due to a database issue.'
                );
                serviceError.statusCode = 500;
                throw serviceError;
            }
            throw new Error('Service error creating cryptocurrency: ' + error.message);
        }
    }

    async updateCryptocurrency(id, cryptoData) {
        try {
            const updatedCrypto = await this.cryptoRepository.update(id, cryptoData);
            if (!updatedCrypto) {
                const error = new Error('Cryptocurrency not found for update');
                error.statusCode = 404;
                throw error;
            }
            return updatedCrypto;
        } catch (error) {
            console.error(
                `Error in CryptoService.updateCryptocurrency for id ${id}:`,
                error.message
            );
            if (error.statusCode) throw error;
            throw new Error('Service error updating cryptocurrency: ' + error.message);
        }
    }

    async deleteCryptocurrency(id) {
        try {
            const deletedCrypto = await this.cryptoRepository.deleteById(id);
            if (!deletedCrypto) {
                const error = new Error('Cryptocurrency not found for deletion');
                error.statusCode = 404;
                throw error;
            }
            return deletedCrypto;
        } catch (error) {
            console.error(
                `Error in CryptoService.deleteCryptocurrency for id ${id}:`,
                error.message
            );
            if (error.statusCode) throw error;
            throw new Error('Service error deleting cryptocurrency: ' + error.message);
        }
    }
}
