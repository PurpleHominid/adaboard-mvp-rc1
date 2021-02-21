'use strict';

function apiassembledata(elements) {
	//assemble the value and name of each element in the 'elements' array list and return as a javascript object
	let data = {}; //initialise an empty javascript object
	for (let i = 0; i < elements.length; i++){ //loop through each element
		switch(elements[i].tagName.toLowerCase()) { //convert tag to lowercase, any match against each 'use' case
			case "input":
				if(apiisnumericdata(elements[i].value)) { //check value is a number
					elements[i].value = Number(elements[i].value); //convert value to numeric type and update
				}
				data[elements[i].name] = elements[i].value; //update the data object with the key-value pair
				console.log("assembling data: " + elements[i].name + " = " + elements[i].value)
				break;
		}
	}	
	return data; //return javascript object, should only contain type 'input' key-value pairs
}


function apiisnumericdata(value) {
	//return true/false depending on whether the value is numeric or not-numeric
	var regex = /[^0-9\-.()]/g; //define pattern of what is NOT numeric value
	if(regex.test(value)) { return false; } 
	return true;
}


function apiresponse(label, data) {
	//update the client's modal to show new status
	document.getElementById('apimodallabel').innerHTML = `API Response: ${label}`; //use template literal and upate the modal's label
	document.getElementById('apimodalresponse').innerHTML = data; //update the modal's main body
}


function apiservicebuildschema() {
	sendGet(`/buildschema`)
		.then(data => {
			console.log(data); // JSON data already parsed as returned data from send function
			console.log("operation: " + data.operation);
			console.log("success: " + data.success);
			console.log("code: " + data.code);
			console.log("message: " + data.message);
			apiresponse(`${data.operation} (http code: ${data.code})`, data.message);
		})
		.catch(function(error) {
			console.log(`Unexpected error: ${error.message} (${error.code})`);
			console.error(error);
		})
}


function apiservicedropschema() {
	//use the server's api service to request dropping the current table schemas
	sendGet(`/dropschema`)
		.then(data => {
			console.log(data); // JSON data already parsed as returned data from send function
			console.log("operation: " + data.operation);
			console.log("success: " + data.success);
			console.log("code: " + data.code);
			console.log("message: " + data.message);
			apiresponse(`${data.operation} (http code: ${data.code})`, data.message);
		})
		.catch(function(error) {
			console.log(`Unexpected error: ${error.message} (${error.code})`);
			console.error(error);
		})
}


function apiserviceadduser(data) {
	sendPost(`/adduser`, data)
		.then(data => {
			console.log(data); // JSON data already parsed as returned data from send function
			console.log("operation: " + data.operation);
			console.log("success: " + data.success);
			console.log("code: " + data.code);
			console.log("message: " + data.message);
			apiresponse(`${data.operation} (http code: ${data.code})`, data.message);
		})
		.catch(function(error) {
			console.log(`Unexpected error: ${error.message} (${error.code})`);
			console.error(error);
		})
}

function apiserviceallusers() {
	sendGet(`/allusers`)
		.then(data => {
			console.log(data); // JSON data already parsed as returned data from send function
			console.log("operation: " + data.operation);
			console.log("success: " + data.success);
			console.log("code: " + data.code);
			console.log("message: " + data.message);

			let result = `<table class='table'>`;
			result += "<tr>";
			for (const key in data.results[0]) {
				result += `<td> ${key} </td>`;
			}
			result += "</tr>";
			for(let i = 0; i < data.results.length; i++) {
				result += "<tr>";
				for (const key in data.results[i]) {
					result += `<td> ${data.results[i][key]} </td>`;
					console.log(`${key}: ${data.results[i][key]} `);
				}
				result += "</tr>";
			}
			result += "</table>";
			apiresponse(`${data.operation} (http code: ${data.code})`, result);
		})

		.catch(function(error) {
			console.log(`Unexpected error: ${error.message} (${error.code})`);
			console.error(error);
		})
}