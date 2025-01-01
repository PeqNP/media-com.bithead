/// Copyright ⓒ 2024 Bithead LLC. All rights reserved.

/**
 * Returns `true` if the type of `value` is a string.
 *
 * @param {mixed} value - value to test if string
 */
function isString(value) {
    return typeof value === 'string';
}

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
    if (isString(value) && value.trim() === "") {
        if (error !== null && error !== undefined) {
            console.log(error);
        }
        return true;
    }
    return false;
}

/**
 * Generate a UUID.
 *
 * @returns {string} - UUID
 */
function generateUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/**
 * Define a read-only function on an object.
 *
 * @param {object} obj - Object that will contain the property to be read-only
 * @param {name} name - Name of property that will be read-only
 * @param {any} value - The value of the read-only property
 */
function readOnly(obj, name, value) {
    Object.defineProperty(obj, name, {
        value: value,
        writable: false, // Do not allow property to be changed
        enumerable: true, // Allow it to be enumerated
        configurable: false // Do not allow property to be redefined
    });
}
