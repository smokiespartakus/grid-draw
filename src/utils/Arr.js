function add(object, key, value, start= 0) {
	if (object === null || object === undefined) {
		//throw error?
		return;
	}
	create(object, key, start);
	object[key] += value;
}

/**
 * Create key/value on object if not set
 * @param object
 * @param key
 * @param value
 */
function create(object, key, value) {
	if (object === null || object === undefined) {
		//throw error?
		return;
	}
	if (object[key] === undefined) object[key] = value;
}

/**
 * Clear all keys of object while keeping obj reference.
 * @todo Does not work with array..
 * @param obj
 */
function clear(obj) {
	for (const prop of Object.getOwnPropertyNames(obj)) {
		delete obj[prop];
	}
}

/**
 * Empty an array
 * @param arr
 */
function clearArray(arr) {
	arr.splice(0, arr.length);
}

/**
 * Loop through array and check if elements should be removed.
 * @param arr
 * @param checkFn
 */
function loopRemove(arr, checkFn) {
	if (!arr) return;
	for (let i=arr.length-1; i>=0; i--) {
		if (arr[i] !== undefined && checkFn(arr[i])) {
			arr.splice(i, 1);
		}
	}
}

module.exports = {
	add: add,
	create: create,
	clear: clear,
	clearArray: clearArray,
	loopRemove: loopRemove,
};
