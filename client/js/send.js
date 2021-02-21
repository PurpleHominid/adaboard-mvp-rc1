'use strict';

function createQueryString(data) {
	//returns a query string version of the passed data object { key1 = value; key2 = value }
	for (const keypair in data) { console.log(`${keypair}: ${data[keypair]}`); } //debug code, view data items
	let string = Object.keys(data).map(key => key + "=" + data[key]).join("&");
	return ([...string].length > 0 ? "?"+string : string);
}


async function sendGet(route, data = {} ) {
	route += createQueryString(data); //append any data to the route address
	console.log(route);
	const response = await fetch(route, { //wait for promise
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
	});
	return response.json(); // parses JSON response into native JavaScript objects
}


async function sendPost(route, data = {} ) {
	const response = await fetch(route, { //wait for promise
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});
	return response.json(); // parses JSON response into native JavaScript objects
}


async function sendPut(route, data = {} ) {
	const response = await fetch(route, { //wait for promise
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});
	return response.json(); // parses JSON response into native JavaScript objects	
}


async function sendPatch(route, data = {} ) {
	const response = await fetch(route, { //wait for promise
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});
	return response.json(); // parses JSON response into native JavaScript objects	
}


async function sendDelete(route, data = {} ) {
	const response = await fetch(route, { //wait for promise
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});
	return response.json(); // parses JSON response into native JavaScript objects		
}