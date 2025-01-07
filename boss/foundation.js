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
 * Check if function is async.
 *
 * @returns {bool} `true` if async function
 */
function isAsyncFunction(fn) {
    return fn?.constructor.name === "AsyncFunction";
}

/**
 * Check if value is string.
 *
 * @param {mixed} value - value to test if string
 * @returns {bool} `true` if the type of `value` is a string.
 */
function isString(value) {
    return typeof value === 'string';
}

/**
 * Check if value is a dictionary.
 *
 * @param {mixed} value - value to test if dict
 * @returns {bool} `true` if value is a dictionary
 */
function isDictionary(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
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
    if (isDictionary(value) && Object.keys(value).length === 0) {
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
 * @param {string} name - Name of property that will be read-only
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
 * Define a property on an object.
 *
 * This is designed to encapsulate a local variable and expose it as
 * a computed property on `obj`.
 *
 * This was primarily designed to support delegation.
 *
 * @param {object} obj - Object to assign property
 * @param {string} name - Name of public property
 * @param {function} get - The getter function
 * @param {function} set - The setter function
 */
function property(obj, name, get, set) {
    Object.defineProperty(obj, name, {
        get: get,
        set: set,
        configurable: false,
        enumerable: true
    });
}

/**
 * Defines a delegate method.
 *
 * @param {string} name - Name of method
 * @param {bool} required - If `true`, enforces method to be implemented
 */
function DelegateMethod(name, required) {
    return {
        name: name,
        required: required
    }
}

/**
 * Define a set of methods that must exist on a delegate.
 *
 * Delegate methods may be a list of `string`s or `DelegateMethod`s. For
 * convenience, this will transform `string` methods into optional
 * `DelegateMethod`s.
 *
 * @param {object} obj - Object to assign property
 * @param {string} name - Name of public property
 * @param {[DelegateMethod]} methods - Delegate methods.
 * @param {function} get - The getter function
 * @param {function} set - The setter function
 * @throws if a required protocol method is not implemented
 */
function protocol(name, obj, prop_name, _methods, get, set) {
    let methods = [];
    let methodNames = [];
    for (let i = 0; i < _methods.length; i++) {
        let method = _methods[i];
        if (typeof method === "string") {
            methods.push(DelegateMethod(method, false));
            methodNames.push(method);
        }
        else {
            methods.push(method);
            methodNames.push(method.name);
        }
    }
    property(obj, prop_name, get, function(value) {
        // Check delegate methods
        let implemented = Object.keys(value);
        for (let i = 0; i < implemented.length; i++) {
            let method = implemented[i];
            if (!methodNames.includes(method)) {
                console.warn(`Protocol (${name}) does not contain method (${method})`);
            }
        }
        for (let i = 0; i < methods.length; i++) {
            let method = methods[i];
            if (method.required && !implemented.includes(method)) {
                throw new Error(`Protocol (${name}) requires method (${method}) to be implemented`);
            }
        }
        set(value);
    });
}

/**
 * Call function, if it exists.
 *
 * This is a convenience method. It was designed for delegate callbacks.
 *
 * @param {function} fn - Call fn, if it has been set
 */
function call(fn) {
    if (!isEmpty(fn)) {
        fn();
    }
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
