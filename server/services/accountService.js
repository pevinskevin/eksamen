export async function getFiatBalance(user, db) {
    const { id } = user;
    const accountQuery = {
        text: 'SELECT * FROM accounts WHERE accounts.user_id = $1;',
        values: [id],
    };
    const accountResult = (await db.query(accountQuery)).rows;

    if (accountResult.length === 0) throw new Error('No fiat account registered to user.');

    return accountResult;
}

export async function getCryptoBalance(user, db) {
    const { id } = user;

    const cryptoHoldingsQuery = {
        text: 'SELECT * FROM crypto_holdings where crypto_holdings.user_id = $1',
        values: [id],
    };
    const cryptoHoldingsResult = (await db.query(cryptoHoldingsQuery)).rows;

    if (cryptoHoldingsResult.length === 0) throw new Error('No crypto account registered to user.');

    return cryptoHoldingsResult;
}
