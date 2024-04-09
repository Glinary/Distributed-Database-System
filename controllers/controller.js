import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2";
import "dotenv/config";

const PASSWORD = process.env.PASSWORD;

const app = express();
app.use(bodyParser.json());

// database configurations
const centralDB = {
  host: "localhost",
  user: "root",
  password: PASSWORD,
  database: "stadvdbmco1",
};
const luzonDB = { ...centralDB, database: "stadvdbmco1" }; //TODO: CHANGE LATER
const visMinDB = { ...centralDB, database: "stadvdbmco1" }; //TODO: CHANGE LATER

// create variable connections
const db = createConnection(centralDB, "centralDB");
const db_2 = createConnection(luzonDB, "luzonDB");
const db_3 = createConnection(visMinDB, "visMinDB");

function createConnection(database, name) {
  let connection = mysql.createConnection(centralDB);

  connection.connect((err) => {
    if (err) {
      console.error(`${name} - Error connecting to MySQL server.`);
      setTimeout(() => createConnection(database, name), 3000); //reconnect again after timeout
    } else {
      console.log(`${name} - Connected to MySQL server successfully!`);
    }
  });

  // close the MySQL connection
  //connection.end();

  return connection;
}

function checkConnection(connection, name) {
  connection.query("SELECT 1", (err) => {
    if (err) {
      console.error(`${name} - check connection failed`);
    } else {
      console.log(`${name} - check connection is successful`);
    }
  });
}

function checkConnections() {
  checkConnection(db, "centralDB");
  checkConnection(db_2, "luzonDB");
  checkConnection(db_3, "visMinDB");
}

function viewDoctors() {
  const sqlCentralDB = "SELECT * FROM doctors LIMIT 10;";
  db.query(sqlCentralDB, (err, results) => {
    if (err) {
      console.error(`Error fetching appointments from CentralDB: ${err}`);
    } else {
      console.log("Appointments from CentralDB");
      console.table(results);
    }
  });
}

//use function to check connections to 3 nodes
//checkConnections();

// use function to view 10 doctors
// viewDoctors()

const controller = {
  getHome: async function (req, res) {
    checkConnections();
    res.render("home", {
      maincss: "/static/css/main.css",
      mainscript: "/static/js/home.js",
    });
  },

  getAllData: async function (req, res) {
    console.log("---HERE---");
    try {
      const sqlCentralDB = "SELECT * FROM appt_main LIMIT 10;";
      db.query(sqlCentralDB, (err, results) => {
        if (err) {
          console.error(`Error fetching appointments from CentralDB: ${err}`);
        } else {
          console.log("Appointments from CentralDB");
          console.table(results);
          res.status(200).json({ rows: results });
        }
      });
    } catch (error) {
      console.error("Error querying database:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  getDoctors: async function (req, res) {
    viewDoctors();

    //TODO: CHANGE LATER
    res.render("home", {
      maincss: "/static/css/main.css",
      mainscript: "/static/js/home.js",
    });
  },
};

export default controller;
