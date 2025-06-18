import { transformFinancialFields } from '../../shared/utils/balanceTransformer.js';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';

export default class TradeService {
    constructor(tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    async getTransactionsByUserId(userId) {
        const transactions = await this.tradeRepository.getTransactionsByUserId(userId);

        const transformedTransactions = [];
        transactions.forEach((element) => {
            transformedTransactions.push(transformFinancialFields(element));
        });
        return normaliseForOpenAPI(transformedTransactions);
    }
}
