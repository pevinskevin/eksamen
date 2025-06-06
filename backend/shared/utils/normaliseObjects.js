import camelcaseKeys from 'camelcase-keys';

// This function:
// 1. Converts nullish values to a empty strings
// 2. Converts Object keys from snake_case to camelCase.
// 3. Both are required to comply with openAPI.yml specification.

// Selects for arrays and objects.
export default function normaliseForOpenAPI(data) {
    // Handle arrays by normalising each object within
    if (Array.isArray(data)) {
        const map = data.map((element) => {
            nullishConverter(element);
            normaliseEmptyBalance(element);
            element = camelcaseKeys(element);
        });
    }
    if (!data || typeof data !== 'object') return;

    // Handles single objects.
    nullishConverter(data);
    normaliseEmptyBalance(data);
    return camelcaseKeys(data);
}

// Converts nullish values in an object to empty strings
function nullishConverter(object) {
    for (let key in object) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) continue;
        let value = object[key];
        if (!value) {
            object[key] = '0';
        }
    }
}

function normaliseEmptyBalance(object) {
    if (object.balance === '' ) object.balance = '0';
}
