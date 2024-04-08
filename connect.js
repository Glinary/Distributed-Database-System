import mysql from 'mysql2'

const centralDB = {
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'stadvdbmco1'
}
const db = createConnection(centralDB, 'centralDB')

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
}
