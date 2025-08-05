import * as util from "./Utils.js";

var objectDefinition;

function setObjectDefinition(objdef) {
	objectDefinition = objdef;
}

function getDisplayNameByObjTypeId(objTypeId) {
	return getPropertyIfExists(objTypeId, "name");
}

function getInternalNameByObjTypeId(objTypeId) {
	return getPropertyIfExists(objTypeId, "internalName");
}


/**
* returns null if something went wrong or the given object is not a container
* returns [] (empty list), if no object types are limited
* returns a list of unlimited object types otherwise
*/
function getUnlimitedObjectTypes(objTypeId) {
	var objInfo = getInfoByObjTypeId(objTypeId);
	if (objInfo.maintype != '0' && objInfo.maintype != '99') {
		return null;
	}
	for (const cabinet of objectDefinition.asobjdef.cabinet) {
		if (cabinet.internal === objInfo.lib) {
			var unlimitedObjects = [];
			var limitedObjects = null;
			for (const object of cabinet.object) {
				if (object.internal === objInfo.internalName) {
					if (object.limited_objects != null)
						limitedObjects = object.limited_objects.limited_object;
				}
			}
			var curInternalName, curObjTypeId;
			for (const object of cabinet.object) {
				curInternalName = object.internal;
				curObjTypeId = object.ids.oid;
				if (object.maintype != '0' && object.maintype != '99') {
					if (!util.listIncludesProperty(limitedObjects, "type", curObjTypeId)) {
						unlimitedObjects.push(curInternalName);
					}
				}
			}
			return unlimitedObjects;
		}
	}
	return null;
}

function getPropertyIfExists(myObjNr, prop) {
	var info = getInfoByObjTypeId(myObjNr);
	console.log(`info: ${info}`);
	if (info === null) return null;
	if (info.hasOwnProperty(prop)) {
		return info[prop];
	}
	else {
		return info;
	}
}

function getInfoByObjTypeId(objTypeId) {
	var output = null;
	for (const cabinet of objectDefinition.asobjdef.cabinet) {
		if (cabinet.object.length > 0) {
			for (const object of cabinet.object) {
					if (object.ids.oid == objTypeId) {
						output = {name: object.name, internalName: object.internal, lib: cabinet.internal, maintype: object.maintype};
					}
				}
		}
	}
	return output;
}


function getFieldProperties(field) {
	var output = { displayName: field.name };
	if (field.hasOwnProperty(`fieldname`)) {
		var fieldDBname = field.fieldname;
		if (fieldDBname.startsWith(`datum`)) {
			output.fieldType = `date`;
		}
		else {
			output.fieldType = ``;
		}
	}
	if (field.flags.hasOwnProperty(`required`)) {
		output.required = field.flags.required;
	}
	return output;
}


function handlePageControl(field, fieldInternalName) {
	var output = {};
	for (const page of field.page) {
		if (util.isIterable(page.fields.field)) {
			for (const pageField of page.fields.field) {
				if (pageField.internal === fieldInternalName) {
					return getFieldProperties(pageField);
				}
			}
		}
		else { // we assume that there is one object
			if ( page.fields.field.hasOwnProperty(`internal`) &&
				page.fields.field.internal === fieldInternalName
			) {
				return getFieldProperties(page.fields.field);
			}
		}
	}
	return output;
}

function getDisplayInfoByInternalName(lib, objInternalName, fieldInternalName) {
	//we assume that a PageCtrl cannot be inserted in another PageCtrl!
	var output = {};
	for (const cabinet of objectDefinition.asobjdef.cabinet) {
		if (cabinet.internal === lib) {
			for (const object of cabinet.object) {
				if (object.internal === objInternalName) {
					if (util.isIterable(object.fields.field)) {
						for (const field of object.fields.field) {
							if (field.internal === fieldInternalName) {
								output = getFieldProperties(field);
							}
							else if (util.stringContainsPageCrtl(field.internal)) {
								var curOutput = handlePageControl(field, fieldInternalName);
								if (curOutput.hasOwnProperty(`displayName`)) output = curOutput;
							}
						}
					} 
					else if (util.stringContainsPageCrtl(object.fields.field.internal)) {
						var curOutput = handlePageControl(object.fields.field, fieldInternalName);
						if (curOutput.hasOwnProperty(`displayName`)) output = curOutput;
					}
				}
			}
		}
	}
	return output;
}

function getObjectsFromCabinet(cabinetTypeNb) {
	var output = [];
	for (const cabinet of objectDefinition.asobjdef.cabinet) {
		if (cabinet.cotype == cabinetTypeNb) {
			for (const object of cabinet.object) {
				if (object.maintype != 99 && object.maintype != 0) {
					output.push({name: object.name, typeNumber: object.ids.oid, internalName: object.internal});
				}
			}
		}
	}
	return output;
}

function getPossibleTargetObjects(objTypeId) {
	var output = [];
	for (const cabinet of objectDefinition.asobjdef.cabinet) {
		if (cabinet.object.length > 0) {
			for (const object of cabinet.object) {
				if (object.ids.oid == objTypeId) {
					output = getObjectsFromCabinet(cabinet.cotype);
				}
			}
		}
	}
	return output;
}

/**
* get information (id, objclass, typeid) of the parent object
* of the given object with @objectId
*/
async function getContainerInfo(objectId) {
	var parentInfo;
	return fetch(`${window.location.origin}/osrest/api/documents/parents/${objectId}`)
	.then((response) => response.json())
	.then(function(data) {
		console.log(data);
		for (const obj of data.documents) {
			var a = obj.type;
			var b = obj.id;
			console.log(a);
			console.log(b);
			if (obj.type == "DOCUMENT") {
				return parentInfo;
			}
			console.log(`${obj.id} ${obj.type} ${obj.objectTypeId}`);
			parentInfo = {id: obj.id, objclass: obj.type, typeid: obj.objectTypeId};
			parentInfo.typeName = getDisplayNameByObjTypeId(obj.objectTypeId);
			parentInfo.internalName = getInternalNameByObjTypeId(obj.objectTypeId);
		}
		return parentInfo;
	});
}


/* function getTargetObjectTypeId(parentId, displayName) {
	for (const cabinet of objectDefinition.asobjdef.cabinet) {
		for (const object of cabinet.object) {
			if (object.ids.oid == 
		}
	}
} */

export {
	objectDefinition, 
	getInfoByObjTypeId, 
	getDisplayNameByObjTypeId, 
	getInternalNameByObjTypeId, 
	getObjectsFromCabinet, 
	getPossibleTargetObjects, 
	getContainerInfo, 
	setObjectDefinition, 
	getUnlimitedObjectTypes, 
	getDisplayInfoByInternalName 
};