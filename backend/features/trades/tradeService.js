import { transformFinancialFields } from '../../shared/utils/balanceTransformer.js';
import normaliseForOpenAPI from '../../shared/utils/normaliseObjects.js';

export default class TradeService {
    constructor(tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    async getTradesByUserId(userId) {
        const trades = await this.tradeRepository.getTradesByUserId(userId);

        const transformedTrades = [];
        trades.forEach((element) => {
            transformedTrades.push(transformFinancialFields(element));
        });

        return normaliseForOpenAPI(transformedTrades);
    }
}
