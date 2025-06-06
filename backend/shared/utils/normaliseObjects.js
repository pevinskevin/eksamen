import camelcaseKeys from 'camelcase-keys';

// Normalises data to comply with OpenAPI specification requirements:
// 1. Converts nullish values to appropriate defaults:
//    - icon_url fields become empty strings ('')
//    - All other nullish fields become '0' (representing decimal values as strings)
// 2. Converts object keys from snake_case to camelCase

export default function normaliseForOpenAPI(data) {
    if (!data) throw new Error('normaliseForOpenAPI(): No data provided for normalisation.');

    if (Array.isArray(data)) {
        // Process each element in the array
        data.forEach((element) => {
            nullishConverter(element);
        });
        return camelcaseKeys(data);
    } else {
        // Process single object
        nullishConverter(data);
        return camelcaseKeys(data);
    }
}

//  Converts nullish values in an object to appropriate defaults:
//  - icon_url fields become empty strings
//  - All other nullish fields become '0' (representing decimal values)
function nullishConverter(object) {
    for (let key in object) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) continue;

        const value = object[key];

        // Special case: icon_url must be an empty string
        const keyIsIconUrlAndValueIsFalsy = key === 'icon_url' && !object['icon_url'];
        if (keyIsIconUrlAndValueIsFalsy) {
            object[key] = '';
            continue;
        }
        // All other nullish values become '0' (representing decimal values)
        if (!value) {
            object[key] = '0';
        }
    }
}
