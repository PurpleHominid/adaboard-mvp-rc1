'use strict';
//database operations and support functions

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//notes
//for information on better-sqlite3 search online or see the link: https://wchargin.github.io/better-sqlite3/api.html
const database = require('better-sqlite3');

//string replacements (non-bound and bound)
//SQLite3 does not allow bind'ed(bound) strings for identifier names (tables, columns, etc). 
//bound values can only use for actual run-time values.

//non-bound parameters (template literals)
//example bound parameter use of '${tablename}' replaced with "var tablename = 'someString' "
//const createTable = db.prepare(`CREATE TABLE IF NOT EXISTS  ${tableName} (${tableColumns})`);
//createTable.run();

//bound parameters
//example (non-bound (${xxx}) and) bound parameter data - use of '?' to be replaced during runtime with 'someString':
//const select = db.prepare(`SELECT * FROM ${tableName} WHERE foo = ?`);
//const results = select.all('someString');

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++


//enumerated common http code types; used to improve readability  
const httpcode = {
	NOTHING: 0,
	OK: 200,
	BADREQUEST: 400,
	NOTFOUND: 404,
	CONFLICT: 409,
};


function _sqlresponse(operation = '', success = true, code = httpcode.OK) {
	let res = new Object();
	res.operation = operation; //set a reference to the operation being executed
	res.success = success; //set the default state of the operation
	res.code = code; //set the default return code
	res.message = ``; //set the default return message
	res.results = []; //set a default array to return any results

	return res;
}


function _showsqlresponse(response) {
	//used to quickly check a function's returned response object 
	console.log(`
		--- debug response object ---
		operation: ${response.operation}
		success: ${response.success}
		code: ${response.code}
		message: ${response.message}
		results: 
		${response.results}
	`);
}


function connect() {
	//this function creates a new database (or uses an existing one) and opens (returns) a connection to it
	try { //try to catch any error that may be detected during this process
		const dbinstance = `./db/adaboard.db`; //create a reference to a (local) database
		let db = new database(dbinstance, { 
			readonly: false, //open as readonly
			fileMustExist: false, //database file must already exist, throw error instead of creating a new instance
			timeout: 1500, //timeout sets the max milliseconds timer to wait when executing queries on a locked database, before throwing a SQLITE_BUSY error; default: 5000
			verbose: console.log //verbose enables a function that gets called with every executed instruction; default: null
		});

		db.pragma(`foreign_keys = true;`); //enable foreign keys, by default sqlite3 is off
		console.log(`foreign key status: ${ db.pragma('foreign_keys', {simple: true}) }`); //show currect foreign keys state
		console.error(`database connection established: ${ dbinstance }`);
		return db; //return the connected database object
	
	} catch(error) {
		console.error(`error, unable to establish database instance: ${ dbinstance }`);
		return null; //return a null object to indicate no active connection
	}
}


function disconnect(db) {
	//close connection
	try {
		console.log(`disconnecting database connection...`);
		if(db.open) {
			console.log(`closing database connection`);
			db.close();
		}
	} catch (error) {
		console.error(`no open connections to close`);
	}
}


function build(db) {
	//define an appropriate sql statement, we are using javascript 'template literals', for more information see:
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
	//by using this technique we can present the statement over multiple line to help ensure and improve overall readability 
	
	//define and set a standard set of default responses as the returned object
	let response = _sqlresponse(`build schema`);
	
	try { //wrap the instructions in a try/catch to protect the process
		const statements = [`
			CREATE TABLE IF NOT EXISTS Users (
				userid INTEGER NOT NULL,
				friendlyname VARCHAR(50),
				emailaddress VARCHAR(320) NOT NULL UNIQUE,
				password VARCHAR(256) NOT NULL,
				admin INTEGER(1),
				lastlogin INTEGER(4) DEFAULT (strftime('%s','now')),
				PRIMARY KEY (userid));
			`,`
			CREATE TABLE IF NOT EXISTS Messages (
				id INTEGER NOT NULL,
				message TEXT, 
				userid INTEGER, 
				created INTEGER(4)DEFAULT (strftime('%s','now')),
				archive INTEGER(1) DEFAULT 0,
				PRIMARY KEY (id),
				FOREIGN KEY(userid) REFERENCES Users (userid) ON DELETE CASCADE);
			`,
			].map(statement => db.prepare(statement)); //map and update each statement as part of the initialisation using 'prepare' to creates an sqlite executable 'statement' object
			
		//running an sql instructions as a transaction allows the database to be 'rolled back' if an exception occurs; this essentially means that the 'whole' transaction with only be 'committed' if no errors are detected
		const run_statements = db.transaction((bounddata = {}) => { //define 'bounddata' as optional, if not provided declare it as an empty object
			for (const statement of statements) { //cycle through each instruction
				statement.run(bounddata); //execute each 'statement' and pass it any provided 'bound' (runtime) data
			}
		});

		//call the transaction wrapper function used to execute each statement
		run_statements.exclusive();
		indexes(db); //run the function to add indexes, this is because sql instructions run in parallel, you could 'serialize' the run but thats more work

	} catch (error) {
		//error detected while attempting to process the request - update the initialised sql return response
		response.success = false;
		response.code = httpcode.BADREQUEST;
		response.message = error.code + ":" + error.message;
	}

	_showsqlresponse(response); //check out the current response before returning to the calling instruction
	return response;
}


function indexes(db) {
	//define and set a standard set of default responses as the returned object
	let response = _sqlresponse(`create indexes`);
	
	try { //wrap the instructions in a try/catch to protect the process
		const statements = [
			`CREATE INDEX IF NOT EXISTS friendlyname_idx ON Users (friendlyname);`,
			].map(statement => db.prepare(statement)); //map and update each statement as part of the initialisation using 'prepare' to creates an sqlite executable 'statement' object
			
		//running an sql instructions as a transaction allows the database to be 'rolled back' if an exception occurs; this essentially means that the 'whole' transaction with only be 'committed' if no errors are detected
		const run_statements = db.transaction((bounddata = {}) => { //define 'bounddata' as optional, if not provided declare it as an empty object
			for (const statement of statements) { //cycle through each instruction
				statement.run(bounddata); //execute each 'statement' and pass it any provided 'bound' (runtime) data
			}
		});

		//call the transaction wrapper function used to execute each statement
		run_statements.exclusive();

	} catch (error) {
		//error detected while attempting to process the request - update the initialised sql return response
		response.success = false;
		response.code = httpcode.BADREQUEST;
		response.message = error.code + ":" + error.message;
	}

	_showsqlresponse(response); //check out the current response before returning to the calling instruction
	return response;
}


function drop(db) {
	//define and set a standard set of default responses as the returned object
	let response = _sqlresponse(`drop tables`);
	
	try { //wrap the instructions in a try/catch to protect the process
		const statements = [
			`DROP TABLE IF EXISTS Messages;`,
			`DROP TABLE IF EXISTS Users;`,
			].map(statement => db.prepare(statement)); //map and update each statement as part of the initialisation using 'prepare' to creates an sqlite executable 'statement' object
			
		//running an sql instructions as a transaction allows the database to be 'rolled back' if an exception occurs; this essentially means that the 'whole' transaction with only be 'committed' if no errors are detected
		const run_statements = db.transaction((bounddata = {}) => { //define 'bounddata' as optional, if not provided declare it as an empty object
			for (const statement of statements) { //cycle through each instruction
				statement.run(bounddata); //execute each 'statement' and pass it any provided 'bound' (runtime) data
			}
		});

		//call the transaction wrapper function used to execute each statement
		run_statements.exclusive();

	} catch (error) {
		//error detected while attempting to process the request - update the initialised sql return response
		response.success = false;
		response.code = httpcode.BADREQUEST;
		response.message = error.code + ":" + error.message;
	}

	_showsqlresponse(response); //check out the current response before returning to the calling instruction
	return response;
}


function adduser(db, userid, friendlyname, emailaddress, admin) {
	//define and set a standard set of default responses as the returned object
	let response = _sqlresponse(`add user`);
	
	try { //wrap the instruction in a try/catch to protect the process
		//this set of instructions runs a single instruction multiple times, each time using the next 'bound' dataset 
		const statement = db.prepare(
			`INSERT INTO Users ( 
				userid, friendlyname, emailaddress, password, admin, lastlogin 
			) VALUES ( 
				@userid, @friendlyname, @emailaddress, '--blank--', @admin, 0
			);`
		);

		//running an sql instructions as a transaction allows the database to be 'rolled back' if an exception occurs; this essentially means that the 'whole' transaction with only be 'committed' if no errors are detected
		const run_statement = db.transaction((bounddata = {}) => { //define 'bounddata' as optional, if not provided declare it as an empty object
			for (const data of bounddata) { //cycle through each instruction
				statement.run(data); //execute the 'statement' for each set of 'bound' (runtime) data
			}
		});

		//call the transaction wrapper function used to execute each statement
		run_statement.exclusive([
			{ userid: userid, friendlyname: friendlyname, emailaddress: emailaddress, admin: admin }
		]);

	} catch (error) {
		//error detected while attempting to process the request - update the initialised sql return response
		response.success = false;
		response.code = httpcode.CONFLICT;
		response.message = error.code + ":" + error.message;
	}

	_showsqlresponse(response); //check out the current response before returning to the calling instruction
	return response;
}


function allusers(db) {
	//define and set a standard set of default responses as the returned object
	let response = _sqlresponse(`all users`);
	
	try { //wrap the instruction in a try/catch to protect the process
		const statement = db.prepare(
			`SELECT 
				userid, 
				friendlyname, 
				emailaddress, 
				password, 
				admin, 
				datetime(lastlogin,'unixepoch') as lastlogin
			FROM
				Users
			ORDER BY 
				userid
			;`
		);

		const results = statement.all(); //execute the statement
		response.results = results; //add any results to the response

	} catch (error) {
		//error detected while attempting to process the request - update the initialised sql return response
		response.success = false;
		response.code = httpcode.CONFLICT;
		response.message = error.code + ":" + error.message;
	}

	_showsqlresponse(response); //check out the current response before returning to the calling instruction
	return response;
}


module.exports = { 
	connect,
	disconnect,
	build,
	drop,
	adduser,
	allusers
}