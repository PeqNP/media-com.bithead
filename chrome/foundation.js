
/**
 * Returns `true` if the value is `null` or `undefined`.
 *
 * @param {*} value - The value to check
 * @return {boolean} - True if the value is `null` or `undefined`
 */
function isEmpty(value, error) {
    if (value === null || value === undefined) {
        if (error !== null && error !== undefined) {
            console.log(error);
        }
        return true;
    }
    return false;
}
