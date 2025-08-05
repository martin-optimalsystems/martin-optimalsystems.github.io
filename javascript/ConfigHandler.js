import * as util from "./Utils.js";


/**********************************************************************
****
	This is a workaround, because Electron is not caught up in version with Chrome
	keyword "assert" was replaced with "with"
	In the future, the static import should be enough:
	import configJson from '../config/config.json' with {type: "json"};
*/
let configJsonPromise
let configJson

if (util.isElectronClient()) {
	//configJsonPromise = import('../config/config.json', {assert: { type: "json" }});
	fetch('config/config.json')
	.then(response => response.json())
	.catch((error) => console.error("Failed to load config.json", error))
	.then(config => {
		console.log("Config loaded", config);
		configJson = config;
	});
}
else {
	configJsonPromise = import('../config/config.json', {with: { type: "json" }, })
	.then(cj => {
		configJson = cj.default;
	}).catch((error) => {
		console.error("Failed to load config.json", error);
	});
}

/**********************************************************************/


const ALLOWED = "ALLOWED_TYPES"

function hasProperty(lib, objType) {
	if (configJson != null) {
		if (configJson.hasOwnProperty(lib)) {
			return configJson[lib].hasOwnProperty(objType);
		}
	}
	return false;
}

function getProperties(lib, objType) {
	if (hasProperty(lib, objType)) {
		return configJson[lib][objType];
	}
	return {};
}

/**
* a value from a config file, can either be a simple string or a JSON subobject with some properties.
* If it is a JSON object, it must have the property "default".
**/
function getDefaultValue(value) {
	if (util.isObject(value)) {
		return value["default"];
	}
	if (util.isString(value)) {
		return value;
	}
	return "";
}

/**
* returns [] (empty array) if no objects are allowed
* returns null if all objects are allowed
* otherwise returns a list of internal names, that are allowed in given container
* e.g. ["iObject1", "iObject2", "iObject3"]
*/
function getAllowedObjectTypes(lib, regType) {
	console.log(`Get allowed types ${lib} ${regType}`);
	if (regType === "") {
		if (configJson.hasOwnProperty(lib)) {
			if (configJson[lib].hasOwnProperty(ALLOWED)) {
				return configJson[lib][ALLOWED];
			}
		}
	}
	else {
		if (hasProperty(lib, regType)) {
			if (configJson[lib][regType].hasOwnProperty(ALLOWED)) {
				return configJson[lib][regType][ALLOWED];
			}
		}
	}
	return null;
}

function getWebclientIP() {
	if (configJson.WebclientOrigin) {
		return configJson.WebclientOrigin;
	}
	return "";
}

export {hasProperty, getProperties, getAllowedObjectTypes, getWebclientIP};