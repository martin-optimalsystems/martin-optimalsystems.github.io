import * as ui from "./UserInterface.js";
import * as obdef from "./ObjectDefinition.js";
import * as cfg from "./ConfigHandler.js";
import * as util from "./Utils.js";

var myDropzone;
var errorCount = 0;

function init() {
	var urlAddon = ``;
	if (util.isElectronClient()) {
		var sessionGuid = util.getSessionGuid();
		//sessionGuid = sessionGuid.substring(1);
		urlAddon = `?sessionguid=${sessionGuid}`;
	}
	//Some servers cannot handle parallel uploads, in this case we can restrict the uploads to 1: (add it to the constructor parameters, by default it is set to 2)
	//parallelUploads: 1
	myDropzone = new Dropzone("div#fileDropzone", { url: `/api/dms/objects${urlAddon}`, paramName: "dropzoneFile", addRemoveLinks: "true", autoProcessQueue: false});
	
	
	disable();
	
	myDropzone.on("addedfiles", function() {
		if (! ui.requiredFieldsFilled()) {
			removeFiles();
			alert(ui.getUserMessage("requiredFieldsEmpty"));
		}
	});
	
	myDropzone.on("sending", function(file, xhr, formData) {
		let data = new Blob([JSON.stringify(return_data(file))], {type : 'application/json'});
		formData.append("data", data)
	});
	
	myDropzone.on("error", function(file, message) {
		var msgEl = $(file.previewElement).find('.dz-error-message');
		if (message) {
			var innerErr = message.failed[0].innerError;
			if (innerErr) {
				if (innerErr.message) {
					msgEl.text(innerErr.message);
				}
				else {
					msgEl.text(innerErr);
				}
			}
			else {
				var innermsg = message.failed[0].message;
				if (innermsg) {
					msgEl.text(innermsg);
				}
				else {
					msgEl.text(message);
				}
			}
		}
		errorCount++;
	});
	
	myDropzone.on("queuecomplete", function() {
		if (errorCount > 0) {
			alert(ui.getUserMessage("errorPrompt"));
		}
		resetErrorCount();
		ui.refreshTarget();
		myDropzone.options.autoProcessQueue = false;
	});
}


function enable() {
	myDropzone.enable();
}

function disable() {
	myDropzone.disable();
}


function removeFiles() {
	myDropzone.removeAllFiles(true);
}

function startUpload() {
	if (myDropzone.files.length > 0) {
		myDropzone.options.autoProcessQueue = true;
		myDropzone.processQueue();
	}
}


function resetErrorCount() {
	errorCount = 0;
}

function addRemove() {
	ui.setRemoveListener(removeFiles);
}

function addClick() {
	ui.setSelectListener(clickOnDropzone);
}

function clickOnDropzone() {
	myDropzone.hiddenFileInput.click();
}

function addStartButton() {
	ui.setStartButtonListener(startUpload);
}


function return_data(file) {
	var data = {
		"objects": [{
			"properties": {
				"system:objectTypeId": {
					"value": ui.getCurrentTargetObjectTypeId()
				},
				"system:parentId": {
					"value": ui.getCurrentParentInfo().id
				}
			},
			"contentStreams": [{
				"mimeType": file.type,
				"fileName": file.name,
				"cid": "dropzoneFile"
			}]
		}]
	}

	
	var targetInfo = obdef.getInfoByObjTypeId(ui.getCurrentTargetObjectTypeId());
	var internalTargetLibName = targetInfo.lib;
	var internalTargetName = targetInfo.internalName;
	if (cfg.hasProperty(internalTargetLibName, internalTargetName)) {
		var additionalValues = cfg.getProperties(internalTargetLibName, internalTargetName);
		
		Object.keys(additionalValues).forEach(key => {
			var inputVal = document.getElementById(`input_${key}`).value;
			if (inputVal.includes("%filename%")) {
				inputVal = inputVal.replace('%filename%', file.name);
			}
			data.objects[0].properties[key] = {"value" : inputVal};
		});
	}
	
	console.log(data);
	return data;
}


export {
	init,
	enable,
	disable,
	removeFiles,
	addRemove,
	addClick,
	addStartButton
};