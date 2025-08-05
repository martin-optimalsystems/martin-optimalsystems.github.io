import * as obdef from "./ObjectDefinition.js";
import * as cfg from "./ConfigHandler.js";
import * as ui from "./UserInterface.js";
import * as dz from "./DropzoneHandler.js";
import * as lib from "./library/library.js";
import * as util from "./Utils.js";


var currentUsername = "";
var webClientOrigin = window.location.origin

// we don't need this, because we can always get window.location.origin at the start of execution
// if (util.isElectronClient()) {
	// webClientOrigin = cfg.getWebclientIP();
// }



$( document ).ready(function() {
	ui.initClient();
	dz.init();
	setDashletEventListener();
	
	dz.addRemove();
	dz.addClick();
	dz.addStartButton();
});




function removeForbiddenObjects(libInternalName, currentObj, targetObjectsList) {
	var allowedObjTypes, unlimitedObjTypes;
	return obdef.getContainerInfo(currentObj)
	.then((parentInfo) => {
		var containerObjType = parentInfo.internalName;
		console.log(`containerinfo: ${parentInfo.id} ${parentInfo.objclass} ${parentInfo.typeid}`);
		unlimitedObjTypes = obdef.getUnlimitedObjectTypes(parentInfo.typeid);
		if (libInternalName === containerObjType) {
			allowedObjTypes = cfg.getAllowedObjectTypes(libInternalName, "");
		}
		else if (containerObjType !== null && containerObjType !== "") {
			allowedObjTypes = cfg.getAllowedObjectTypes(libInternalName, containerObjType);
		}
		else {
			allowedObjTypes = [];
		}
		var allowedObjGiven = true;
		if (allowedObjTypes === null) allowedObjGiven = false;
		if (unlimitedObjTypes === null) return [];
		//remove all objects in targetObjectsList that are not in allowedObjTypes
		//targetObj is {name, typeNumber, internalName}
		targetObjectsList = targetObjectsList.filter(targetObj => {
			if (!allowedObjGiven) {
				return unlimitedObjTypes.includes(targetObj.internalName); 
			}
			var outputVal = allowedObjTypes.includes(targetObj.internalName) 
					&& unlimitedObjTypes.includes(targetObj.internalName);
			return outputVal;
		});
		return targetObjectsList;
	});
}





function addTargetEventListener() {
	document.querySelector('#document_typelist').addEventListener('change', (ev) => {
		dz.enable();
		var targetObjectIdx = ev.target.selectedIndex;
		var targetObjectTypeNb = ev.target[targetObjectIdx].value;
		console.log(`targetObjectTypeNb: ${targetObjectTypeNb}`);
		ui.setCurrentTargetObjectTypeId(targetObjectTypeNb);
		var targetInfo = obdef.getInfoByObjTypeId(ui.getCurrentTargetObjectTypeId());
		var internalTargetLibName = targetInfo.lib;
		var internalTargetName = targetInfo.internalName;
		if (cfg.hasProperty(internalTargetLibName, internalTargetName)) {
			var additionalValues = cfg.getProperties(internalTargetLibName, internalTargetName);
			console.log(additionalValues);
			createFormFields(internalTargetLibName, internalTargetName, additionalValues);
			ui.showUploadDetails();
		} 
		else {
			ui.setAdditionalFields(ui.getUserMessage("noValuesMessage"));
			ui.showDropzoneWithoutIndexdata();
		}
	});
}

function removeTargetEventListener() {
	if (document.querySelector('#document_typelist') !== null)
		document.querySelector('#document_typelist').removeEventListener();
}


function createFormFields(lib, internalName, valuesList) {
	var formInnerHTML = ``;
	ui.clearCurRequiredFields();
	Object.keys(valuesList).forEach(key => { //for each internal field name
		var displayInfo = obdef.getDisplayInfoByInternalName(lib, internalName, key);
		formInnerHTML = formInnerHTML + ui.getFormField(valuesList[key], displayInfo, key);
	});
	ui.setAdditionalFields(formInnerHTML)
	$('.in-form-select').select2({
		tags: true,
		selectionCssClass: 'validinput',
		placeholder: ui.getUserMessage("selectOptionPrompt")
	});
	$('.in-form-select.required').select2({
		tags: true,
		selectionCssClass: 'invalidinput',
		placeholder: ui.getUserMessage("selectOptionPrompt")
	});
	$('select.required').change((changeEvent) => {
		if (changeEvent.target) {
			if (changeEvent.target.id.startsWith('input_')) {
				if (changeEvent.target.value !== "") {
					$(`.in-form-select.required#${changeEvent.target.id}`).select2({
						tags: true,
						selectionCssClass: 'validinput',
						placeholder: ui.getUserMessage("selectOptionPrompt")
					});
				}
			}
		}
	});
}


async function initDashlet() {
	console.log("initDashlet");
	ui.hideUploadDetails();
	ui.displayLoading();
	console.log(`Requesting object definition: ${webClientOrigin}/api/dms/schema/native`);
	fetch(`${webClientOrigin}/api/dms/schema/native`)
	.then((response) => response.json())
	.then(function(data) {
		obdef.setObjectDefinition(data);
		updateDashlet();
	});
	fetch(`${webClientOrigin}/api/dms/info/native`)
	.then(response => response.json())
	.then(data => {
		currentUsername = data.user.fullName;
		ui.setCurrentUserName(currentUsername);
	});
}

async function updateDashlet() {
	console.log("updateDashlet");
	ui.hideUploadDetails();
	ui.clearCurRequiredFields();
	/* displayLoading(); */
	var selectedObjectPromise = ui.getCurrentSelectedObject();
	selectedObjectPromise.then((selectedObject) => {
		if (Object.keys(selectedObject).length === 0) { }
			//ui.displayNonSelectedMessage();
		else {
			console.log(selectedObject);
			
			var objTypeId = selectedObject["objectTypeId"];
			console.log(`objTypeId ${objTypeId}`);
			var objInfo = obdef.getInfoByObjTypeId(objTypeId);
			var objLib = objInfo.lib;
			var objectId = selectedObject["objectId"];
			ui.setCurrentSelectedObject(objectId);
			var targetObjectsList;
			
			
			//reset fields and dropzone
			ui.setAdditionalFields(ui.getUserMessage("selectDocumentPrompt"));
			dz.disable();
			
			var previous_options = document.querySelectorAll('#document_typelist option');
			previous_options.forEach(o => o.remove());
			
			console.log(obdef.objectDefinition);
			targetObjectsList = obdef.getPossibleTargetObjects(objTypeId);
			removeForbiddenObjects(objLib, objectId, targetObjectsList)
			.then((targetObjectsList) => handleTargetList(targetObjectsList, objectId))
			.then(ui.hideLoading());
		}
	});
}



function setDashletEventListener() {
	//check if webClientOrigin works like that
	lib.registerOnInitCallback(() => initDashlet(), webClientOrigin);
	lib.registerOnUpdateCallback(() => updateDashlet(), webClientOrigin);
	/* window.addEventListener("message", e => {
		if (e.data.type == 'onInit') {
			console.log("onInit in MultiUpload.html");
			initDashlet();
		}
		else if (e.data.type == 'onUpdate') {
			console.log("onUpdate in MultiUpload.html");
			updateDashlet();
		}
		else {
			if (e.data)
				console.log(e.data.type);
		}
	}); */
}


function handleTargetList(targetObjectsList, selectedObjectId) {
	return new Promise((resolve, reject) => {
		if (targetObjectsList.length == 0) {
			removeTargetEventListener();
			ui.insertNotAvailableMessage();
			//insertNotAvailableMessage(targetContainerContainer);
		}
		else {
			ui.insertSelectTarget();
			//insertTargetContainerInfo(targetContainerContainer);
			addTargetEventListener();
			ui.setTargetObjOptions(targetObjectsList);
			
			obdef.getContainerInfo(selectedObjectId)
			.then((parentInfo) => {
				ui.setCurrentParentInfo(parentInfo);
				//insertTargetContainerInfo(targetContainerContainer, `Type: ${parentInfo.typeName}, Class: ${parentInfo.objclass}, Id: ${parentInfo.id}`);
			});
		}
	});
}
