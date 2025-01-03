/// Copyright ⓒ 2024 Bithead LLC. All rights reserved.

function Result(value) {
    if (value instanceof Error) {
        this.ok = false;
        this.error = value;
    }
    else {
        this.ok = true;
        this.value = value;
    }
}


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

/**
 * Generate an 8 character object ID that starts with a character.
 *
 * This is designed for generating IDs used for a window instance.
 *
 * @returns {int} Returns a unique object ID
 */
function makeObjectId() {
    const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let id = "";
    for (let i = 0; i < 8; i++) {
        id += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
    }

    return id;
}

/**
 * Returns value for given key path in nested dictionary.
 *
 * Used in conjunction with `interpolate`.
 *
 * @param {object} obj - Dictionary
 * @param {string} path - String path that identfies key in nested dictionary
 */
function getValue(obj, keyPath) {
    if (typeof(keyPath) !== 'string') {
        console.warn(`Invalid key path (${keyPath}). Expected string.`);
        return null;
    }

    let path = keyPath.split('.')
    return path.reduce(function(x, y) {
        return x[y];
    }, obj);
}

/**
 * Interpolate tokens in string with values in object.
 *
 * ```
 * let person = {person: {name: 'Joe'}};
 * let name = 'My name is, ${person.name}.';
 * console.log(interpolate(name, person));
 * // prints 'My name is, Joe.'
 * ```
 *
 * @param {string} str - String that contains tokens to interpolate
 * @param {object} obj - Dictionary that contains token values
 * @returns {string}
 */
function interpolate(str, obj) {
    return str.replace(/\$\((.*?)\)/g, (x, g) => getValue(obj, g));
}
