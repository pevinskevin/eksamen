function tradeInput(userId, cryptocurrencyId, orderType, quantity, price = 0) {
    return {
        userId,
        cryptocurrencyId,
        orderType,
        quantity,
        price,
    };
}
