// NOTE: This file is strictly for testing. 
// Use command 'npm run connect' to see of mySQL commands work.
import mysql from 'mysql2'

// database configurations
const centralDB = {
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'stadvdbmco1'
};
const luzonDB = { ...centralDB, database: 'luzonDB'};
const visMinDB = { ...centralDB, database: 'visMinDB'};

const db = createConnection(centralDB, 'centralDB');
const db_2 = createConnection(luzonDB, 'luzonDB');
const db_3 = createConnection(visMinDB, 'visMinDB');


function createConnection(database, name) {
  let connection = mysql.createConnection(centralDB);
  
  connection.connect((err) => {
    if (err) {
      console.error(`${name} - Error connecting to MySQL server.`)
      setTimeout(() => createConnection(database), 3000); //reconnect again after timeout
    } else {
      console.log(`${name} - Connected to MySQL server successfully!`)
    }
  }) 

  // close the MySQL connection
  //connection.end();

  return connection
}

function checkConnection(connection, name) {
  connection.query('SELECT 1', (err) => {
    if (err) {
      console.error(`${name} - check connection failed`);
    } else {
      console.log(`${name} - check connection is successful`);
    }
  })
}

function checkConnections() {
  checkConnection(db, 'centralDB');
  checkConnection(db_2, 'luzonDB');
  checkConnection(db_3, 'visMinDB');
}

// use function to check connections to 3 nodes
// checkConnections();