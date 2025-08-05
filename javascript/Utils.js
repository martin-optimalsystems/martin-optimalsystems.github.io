function listIncludesProperty(list, prop, value) {
	if (list !== null) {
		if (Array.isArray(list)) {
			for (const o of list) {
				if (o[prop] === value) {
					return true;
				}
			}
		}
	}
	return false;
}

function isIterable(obj) {
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}

function isObject(obj) {
	var output = false;
	if (typeof obj === 'object' &&
		!Array.isArray(obj) &&
		obj !== null
	) {
		output = true;
	}
	return output;
}

function isString(str) {
	var output = false;
	if (typeof str === 'string') {
		output = true;
	}
	return output;
}

function stringContainsPageCrtl(value) {
	return testStringRegex(value, "[Pp]+age[Cc]+trl");
}

function testStringRegex(text, regex) {
	var regexPattern = new RegExp(regex);
	return regexPattern.test(text);
}

function isElectronClient() {
	var output = navigator.userAgent.toLowerCase().indexOf('electron') > -1
	return output;
}


//get the guid from url
function getSessionGuid() {
	const dashletUrl = new URL(window.location.href);
	var curGuid = dashletUrl.searchParams.get("sessionguid");
	return curGuid;
}


export{ listIncludesProperty, isIterable, stringContainsPageCrtl, isObject, isElectronClient, getSessionGuid }