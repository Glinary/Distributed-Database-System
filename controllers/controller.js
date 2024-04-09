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

    const category = req.body.data;
    const pageNum = req.body.pageNum;

    const categories = {
      alldoctors: `select doctorid, mainspecialty as "Main Specialty", age from doctors limit 15 offset ${
        (pageNum - 1) * 15
      };`,
      allclinic: `select * from clinics LIMIT 15 offset ${(pageNum - 1) * 15};`,
      allpatients: `select * from px LIMIT 15 offset ${(pageNum - 1) * 15};`,
      alldata: `select pxid, clinicid, doctorid, apptid, status, DATE_FORMAT(TimeQueued, "%l:%i %p") as "Time Queued",  DATE_FORMAT(TimeQueued, "%M %d, %Y") as "Date Queued", DATE_FORMAT(StartTime, "%l:%i %p") as "Start Time", DATE_FORMAT(EndTime, "%l:%i %p") as "End Time", type as "Type", appt_main.virtual as "Virtual" FROM appt_main LIMIT 15 offset ${
        (pageNum - 1) * 15
      };`,
    };

    try {
      const sqlCentralDB = categories[category];
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

  getAddToDB: async function (req, res) {
    const category = req.body.category;

    if (category == "patients") {
      var data = req.body.json;
      var { age, gender } = JSON.parse(data);

      var table = "px";
      var primaryKey = "pxid";
      var columns = "(pxid, age, gender)";
      var valuesCount = "VALUES (?,?,?)";
    }

    // SQL query to insert data into the 'px' table
    var sql = `INSERT INTO ${table} ${columns} ${valuesCount}`;

    // SQL query to retrieve the last inserted ID from the 'px' table
    var sqlLastId = `SELECT ${primaryKey} FROM ${table} ORDER BY ${primaryKey} DESC LIMIT 1`;

    // Retrieve the last inserted ID from the 'px' table
    db.query(sqlLastId, (err, result) => {
      if (err) {
        console.error("Error retrieving last ID from database:", err);
        res.status(500).send("Internal Server Error");
      } else {
        let nextID;

        if (result.length > 0) {
          // Extract the last inserted ID from the result
          const lastID = result[0].pxid;

          // Convert the lastID from hexadecimal to a BigInt value
          const intValue = BigInt(`0x${lastID}`);

          // Increment the lastID value
          const nextValue = intValue + BigInt(1);

          // Convert the incremented value back to hexadecimal
          nextID = nextValue.toString(16);
        } else {
          // If no records found, start with '1' as the next ID
          nextID = "1";
        }

        // Convert nextID to uppercase
        nextID = nextID.toUpperCase();

        if (category == "patients") {
          var values = [nextID, age, gender];
        }

        db.query(sql, values, (err, results) => {
          if (err) {
            console.error(`Error inserting data into database: ${err}`);
            res.status(500).send("Internal Server Error");
          } else {
            console.log("Data inserted successfully");
            res.status(200).json({ message: "Data inserted successfully" });
          }
        });
      }
    });
  },

  getAllNewData: async function (req, res) {
    console.log("---HERE---");

    const category = req.body.data;
    const pageNum = req.body.pageNum;

    const categories = {
      alldoctors: `select doctorid, mainspecialty as "Main Specialty", age from doctors ORDER BY doctorid DESC LIMIT 5;`,
      allclinic: `select * from clinics ORDER BY clinicid DESC LIMIT 5;`,
      allpatients: `SELECT pxid, age, gender FROM px ORDER BY pxid DESC LIMIT 5;`,
      alldata: `select pxid, clinicid, doctorid, apptid, status, DATE_FORMAT(TimeQueued, "%l:%i %p") as "Time Queued",  DATE_FORMAT(TimeQueued, "%M %d, %Y") as "Date Queued", DATE_FORMAT(StartTime, "%l:%i %p") as "Start Time", DATE_FORMAT(EndTime, "%l:%i %p") as "End Time", type as "Type", appt_main.virtual as "Virtual" FROM appt_main ORDER BY apptid DESC LIMIT 5;`,
    };

    console.log(categories[category]);

    try {
      const sql = categories[category];
      db.query(sql, (err, results) => {
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

  getDataCount: async function (req, res) {
    const category = req.body.category;
    console.log(category);

    const categories = {
      doctors: "doctors",
      clinics: "clinics",
      patients: "px",
      undefined: "appt_main",
    };

    try {
      const sqlCentralDB = `SELECT COUNT(*) as count FROM ${categories[category]};`;
      db.query(sqlCentralDB, (err, results) => {
        if (err) {
          console.error(`Error fetching appointments from CentralDB: ${err}`);
        } else {
          console.log("Appointments from CentralDB");
          console.table(results);
          res.status(200).json({ rowsCount: results });
        }
      });
    } catch (error) {
      console.error("Error querying database:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  getDoctors: async function (req, res) {
    //viewDoctors();
    res.render("home", {
      maincss: "/static/css/main.css",
      mainscript: "/static/js/home.js",
    });
  },
};

export default controller;
