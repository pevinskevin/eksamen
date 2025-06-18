import { cryptoService } from '../../shared/factory/factory.js';
import { transformFinancialFields } from '../../shared/utils/balanceTransformer.js';
import validateCryptoSymbol from '../cryptocurrencies/cryptoValidators.js';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';
import { hashPassword } from '../../shared/utils/hashing.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export default class AccountService {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }

    async delete(userId) {
        const deletedAccount = await this.accountRepository.delete(userId);
        if (!deletedAccount) throw new Error('Deletion failed');
        return 'Account deleted successfuly';
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

        return normaliseForOpenAPI(transformedHoldings);
    }

    async cryptoDeposit(userId, amount) {
        return await this.accountRepository.incrementCryptoHolding(userId, 2, amount); // ETH ID = 2
    }

    async cryptoWithdrawal(userId, amount) {
        const negativeAmount = -amount;
        const balance = (await this.accountRepository.findCryptoHolding(userId, 'ETH')).balance;
        if (amount > balance)
            throw new Error('Amount exceeds users available balance of: ' + balance);

        return await this.accountRepository.incrementCryptoHolding(userId, 2, negativeAmount); // ETH ID = 2
    }

    async fiatDeposit(userId, amount) {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Account Deposit' },
                        unit_amount: amount * 100, // cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:5173/dashboard?deposit=success',
            cancel_url: 'http://localhost:5173/dashboard',
            metadata: { userId },
        });

        await this.accountRepository.incrementFiatAccount(userId, amount);

        return { url: session.url };
    }

    async fiatWithdrawal(userId, amount) {
        const negativeAmount = -amount;
        const balance = (await this.accountRepository.findFiatAccount(userId)).balance;
        if (amount > balance)
            throw new Error('Amount exceeds users available balance of: ' + balance);

        return await this.accountRepository.incrementFiatAccount(userId, negativeAmount);
    }

    async updateAccountInformation(userId, updatedInformationObject) {
        const { password = null } = updatedInformationObject;
        if (password) {
            password = await hashPassword(password);
        }
        const update = await this.accountRepository.updateAccount(
            userId,
            updatedInformationObject,
            password
        );
        return normaliseForOpenAPI(update);
    }
}
