//import * as mn from "./main.js";
import * as lib from "./library/library.js"

const loader = document.querySelector("#loading");
const fullDashlet = document.querySelector("#fullDashlet");
const docTypeHeader = document.getElementById("doctype_header");
const collapsibleButton = document.getElementById("collapsible_button");
const uploadDetails = document.querySelectorAll('.upload_details');
const indexdataZone = document.querySelector('#indexdata_zone');
const fullDropzone = document.querySelector('#full_dropzone');
const additionalFields = document.getElementById("collapsibleContent");
const dzMessage = document.getElementById("dz_message");
const targetTypeContainer = document.getElementById("typelist_container");
const clearButton = document.querySelector('#clearButton');
const selectButton = document.querySelector('#selectButton');
const startButton = document.querySelector('#startButton');
const selectPrompt = document.querySelector('#selectPrompt');

var language = document.documentElement.lang;
var userMessages;
var isElectronClient = false;
var currentTargetObjectTypeId;
var curRequiredFields = []
var currentParentInfo;
var currentSelectedObject;
var currentUsername;


function initClient() {
	if (navigator) {
		if (navigator.userAgent) {
			if (navigator.userAgent.toLowerCase().includes(`electron`)) {
				isElectronClient = true;
			}
		}
	}
	loadLanguageJson();
	
	// Part for collapsible (form for input values)
	var coll = document.getElementsByClassName("collapsible");
	var i;
	var click_event = new CustomEvent('click');

	for (i = 0; i < coll.length; i++) {
		//coll[i].classList.toggle("active");
		coll[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var content = this.nextElementSibling;
			if (content.style.display === "grid") {
				content.style.display = "none";
			} else {
				content.style.display = "grid";
			}
		});
		if (coll[i].id === "collapsible_button")
			coll[i].click();
	}
}


function displayLoading() {
	loader.classList.remove("hide");
	fullDashlet.classList.remove("show");
	hideNonSelectedMessage();
}

function hideLoading() {
	loader.classList.add("hide");
	fullDashlet.classList.add("show");
	hideNonSelectedMessage();
}


function loadLanguageJson() {
	var langPath;
	if (language === "de") {
		langPath = `./language/de.json`;
	} // <--- insert other languages here
	else {
		langPath = `./language/en.json`;
	}
	
	$.getJSON(langPath, json => {
		userMessages = json;
		//set static labeling
		docTypeHeader.innerHTML = userMessages.documentType;
		collapsibleButton.innerHTML = userMessages.additionalFields;
		additionalFields.innerHTML = userMessages.selectDocumentPrompt;
		clearButton.innerHTML = userMessages.clearDropzone;
		selectButton.innerHTML = userMessages.selectDocuments;
		startButton.innerHTML = userMessages.startUpload;
		//selectPrompt.innerHTML = userMessages.selectObjectPrompt;
		dzMessage.innerHTML = `<span>${userMessages.dropzoneMessage}</span>`;
	});
}

function getUserMessage(name) {
	return userMessages[name];
}


function hideUploadDetails() {
	uploadDetails.forEach((elem) => elem.classList.remove("show"));
}

function showUploadDetails() {
	uploadDetails.forEach((elem) => elem.classList.add("show"));
}

function showDropzoneWithoutIndexdata() {
	indexdataZone.classList.remove("show");
	fullDropzone.classList.add("show");
	hideNonSelectedMessage();
}


function insertNotAvailableMessage() {
	targetTypeContainer.innerHTML = userMessages.notAvailableMessage;
}

function insertSelectTarget() {
	targetTypeContainer.innerHTML = `<Select id=\"document_typelist\" class=\"dropdown\"><option disabled selected value>${userMessages.selectOptionPrompt}</option></select>`;
}

function setAdditionalFields(content) {
	additionalFields.innerHTML = content;
}

function refreshTarget() {
	if (isElectronClient === false) {
		//mn.openLocation(currentSelectedObject, false);
		lib.openLocation(false, currentSelectedObject);
	}
}

function setClickListener(targetButton, functionToCall) {
	targetButton.addEventListener('click', functionToCall);
}

function setRemoveListener(functionToCall) {
	setClickListener(clearButton, functionToCall);
}

function setSelectListener(functionToCall) {
	setClickListener(selectButton, functionToCall);
}

function setStartButtonListener(functionToCall) {
	setClickListener(startButton, functionToCall);
}

function requiredFieldsFilled() {
	for (const field of curRequiredFields) {
		var inputValue = document.getElementById(field).value;
		if (inputValue == null || inputValue == "") return false;
	}
	return true;
}


function setCurrentTargetObjectTypeId(id) {
	currentTargetObjectTypeId = id;
}

function getCurrentTargetObjectTypeId() {
	return currentTargetObjectTypeId;
}


function clearCurRequiredFields() {
	curRequiredFields = []
}

function addCurRequiredField(field) {
	curRequiredFields.push(field);
}

function setCurrentParentInfo(info) {
	currentParentInfo = info;
}

function getCurrentParentInfo() {
	return currentParentInfo;
}

function setCurrentSelectedObject(obj) {
	currentSelectedObject = obj;
}

async function getCurrentSelectedObject() {
	const selectedObjList = await lib.getSelectedObjects();
	if (selectedObjList.length > 0) {
		return selectedObjList[0];
	}
	return {};
	//return mn.getCurrentSelectedObject();
}

function setCurrentUserName(name) {
	currentUsername = name;
}


/**
* defaultVal: can be array or single value for default value in text input field (see in config file)
* displayInfo: metadata for an object-definition field (must contain values for "displayName" and "required")
* fieldInternalName: internal name of object-definition field
**/
function getFormField(defaultVal, displayInfo, fieldInternalName) {
	var displayName = displayInfo.displayName;
	var required = false;
	if (displayInfo.required) required = true;
	var formInnerHTML = `<label for="input_${fieldInternalName}">`;
	if (required) {
		addCurRequiredField(`input_${fieldInternalName}`);
		formInnerHTML = formInnerHTML + `<u>${displayName}</u></label> `;
	} else {
		formInnerHTML = formInnerHTML + `${displayName}</label> `;
	}
	if (Array.isArray(defaultVal)) {
		if (required) formInnerHTML = formInnerHTML + `<select class="in-form-select required" id="input_${fieldInternalName}" required>`;
		else formInnerHTML = formInnerHTML + `<select class="in-form-select" id="input_${fieldInternalName}">`;
		formInnerHTML = formInnerHTML + `<option></option>`;
		for (const curVal of defaultVal) {//for each value (suggested options) in list
			var curValReplaced = replacePlaceholders(curVal);
			formInnerHTML = formInnerHTML + `<option>${curValReplaced}</option>`;
		}
		formInnerHTML = formInnerHTML + `</select>`;
	}
	else {
		defaultVal = replacePlaceholders(defaultVal);
		if (displayInfo.fieldType === `date`) {
			formInnerHTML = formInnerHTML + `<input type="date" id="input_${fieldInternalName}" value="${defaultVal}"`;
		}
		else {
			formInnerHTML = formInnerHTML + `<input type="text" id="input_${fieldInternalName}" value="${defaultVal}"`;
		}
		if (required) formInnerHTML = formInnerHTML + ` required />`;
		else formInnerHTML = formInnerHTML + ` />`;
	}
	return formInnerHTML;
}


function replacePlaceholders(val) {
	if (val.includes('%currentuser%')) {
		val = val.replace('%currentuser%', currentUsername);
	}
	if (val.includes('%currentdate%')) {
		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = today.getFullYear();
		var hh = String(today.getHours()).padStart(2, '0');
		var nn = String(today.getMinutes()).padStart(2, '0');
		val = val.replace('%currentdate%', `${yyyy}-${mm}-${dd}`);
	}
	return val;
}


function setTargetObjOptions(targetObjectsList) {
	const targetTypeField = document.getElementById("document_typelist");
	
	for (const targetObj of targetObjectsList) {
		let option = document.createElement("option");
		option.setAttribute('value', targetObj.typeNumber);
		let optionText = document.createTextNode(targetObj.name);
		option.appendChild(optionText);
		targetTypeField.appendChild(option);
	}
	
	if (targetObjectsList.length == 1) {
		setCurrentTargetObjectTypeId(targetObjectsList[0].typeNumber);
		targetTypeField.value = targetObjectsList[0].typeNumber;
		targetTypeField.dispatchEvent(new Event('change'))
	}
}


function displayNonSelectedMessage() {
	loader.classList.add("hide");
	fullDashlet.classList.remove("show");
	selectPrompt.classList.add("show");
}

function hideNonSelectedMessage() {
	selectPrompt.classList.remove("show");
}


export {
	displayLoading,
	hideLoading,
	loadLanguageJson,
	hideUploadDetails,
	showUploadDetails,
	showDropzoneWithoutIndexdata,
	getUserMessage,
	insertNotAvailableMessage,
	insertSelectTarget,
	setAdditionalFields,
	refreshTarget,
	getCurrentSelectedObject,
	setCurrentSelectedObject,
	initClient,
	requiredFieldsFilled,
	setCurrentTargetObjectTypeId,
	getCurrentTargetObjectTypeId,
	clearCurRequiredFields,
	addCurRequiredField,
	setCurrentParentInfo,
	getCurrentParentInfo,
	setRemoveListener,
	setSelectListener,
	setStartButtonListener,
	getFormField,
	setCurrentUserName,
	setTargetObjOptions,
	displayNonSelectedMessage,
	hideNonSelectedMessage
};