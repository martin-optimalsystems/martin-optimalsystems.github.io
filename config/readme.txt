config.json should be configured as follows:

Default values are for field values that should be filled.
It is necessary to at least configure all mandatory fields on the enaio mask.
If no configuration is defined on a container (folder or class), then the document can still be uploaded without any index data. 
(If no mandatory fields are on the object)

- Default values are defined with a string 
	"Internal field name": "default value"
- Dropdowns are defined by a list (dropdown is not binding, you can also insert other values than suggested) 
	"Internal field name": ["value1", "value2"]
- There are placeholders
	- %filename% will be replaced only after upload (filenames differ for multiple files)
	- %currentuser% will be replaced with current user, already in the UI mask
	- %currentdate% will be also replaced already in the UI mask
- Within cabinets/folders and registers a parameter "ALLOWED_TYPES" can be defined. 
	It limits the allowed object types in the container.
	If it is just an empty list ([ ]), then no types are allowed.



Configuration Code example:

{
	"Library internal name": {
		"ALLOWED_TYPES": ["allowed document type 1", "allowed document type 2"],
		"Object internal name": {
			"Field internal name": "default value",
			"Next field internal name": "default value", ...
		},
		"Another object internal name": {
			"Field internal name": "default value",
			"Next field internal name": "default value", ...
		},
		"Register or folder (object) internal name": {
			"ALLOWED_TYPES": ["", "", ""]
		},
	},
	"Next library internal name" { ... }
	
}