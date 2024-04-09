import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2";
import connect from "../connect.js";

const app = express();
app.use(bodyParser.json());

// database configurations
const centralDB = {
  host: "localhost",
  user: "root",
  password: process.env.LOCAL_DB_PASSWORD,
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

function formattedDatetime(variable) {
  var [hours, minutes] = variable.split(":");

  // Create a new Date object with today's date and the specified time
  var today = new Date();
  today.setHours(hours);
  today.setMinutes(minutes);
  today.setSeconds(0); // Set seconds to zero if you don't need them

  // Format the datetime string for MySQL (YYYY-MM-DD HH:MM:SS)
  var formattedDatetime = today.toISOString().slice(0, 19).replace("T", " ");
  return formattedDatetime;
}

const controller = {
  getHome: async function (req, res) {
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
      alldoctors: `SELECT doctorid, mainspecialty AS "Main Specialty", age FROM doctors LIMIT 15 OFFSET ${
        (pageNum - 1) * 15
      };`,
      allclinic: `SELECT * FROM clinics LIMIT 15 OFFSET ${(pageNum - 1) * 15};`,
      allpatients: `SELECT * FROM px LIMIT 15 OFFSET ${(pageNum - 1) * 15};`,
      alldata: `SELECT pxid, clinicid, doctorid, apptid, status,
                      DATE_FORMAT(TimeQueued, "%l:%i %p") AS "Time Queued",
                      DATE_FORMAT(QueueDate, "%M %d, %Y") AS "Date Queued",
                      DATE_FORMAT(StartTime, "%l:%i %p") AS "Start Time",
                      DATE_FORMAT(EndTime, "%l:%i %p") AS "End Time",
                      type AS "Type", appt_main.virtual AS "Virtual"
               FROM appt_main LIMIT 15 OFFSET ${(pageNum - 1) * 15};`,
      // alldata: `SELECT pxid, clinicid, doctorid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type AS "Type", appt_main.virtual as "Virtual" FROM appt_main LIMIT 15 OFFSET ${
      //   (pageNum - 1) * 15
      // };`,
    };

    async function connectionReRoute() {
      let connection;
      try {
        connection = connect.central_node.getConnection();
        node = connect.central_node;
      } catch (err) {
        try {
          connection = connect.luzon_node.getConnection();
          node = connect.luzon_node;
        } catch (err) {
          try {
            connection = connect.vismin_node.getConnection();
            node = connect.vismin_node;
          } catch (err) {
            console.log(err);
            res.status(500).send("Error retrieving data from database");
          }
        }
      }
    }

    console.log("Getting data...");
    let node;

    const sql = categories[category];

    await connectionReRoute();
    const [result] = await connect.dbQuery(node, sql, []);

    if (node === connect.central_node) {
      console.table(result);
      res.status(200).json({ rows: result });
    } else {
      const [result2] = await connect.dbQuery(
        node === connect.luzon_node ? connect.vismin_node : connect.luzon_node,
        sql,
        []
      );

      console.table(result2);
      res.status(200).json({ rows: result2 });

      // const combinedData = appointments.concat(appointments2);
      // const uniqueData = [
      //   ...new Map(combinedData.map((item) => [item.id, item])).values(),
      // ];
      // uniqueData.sort((a, b) => a.id - b.id);
      // //sample of how to read output
      // appointments2.forEach((appointment2) => {
      //   console.log(appointment2.status);
      // });
      // res.render("home", {
      //   maincss: "/static/css/main.css",
      //   mainscript: "/static/js/home.js",
      // });
    }
  },

  getAddToDB: async function (req, res) {
    let location = "luzon";
    var data = req.body.json;
    var {
      pxid,
      clinicid,
      doctorid,
      status,
      TimeQueued,
      QueueDate,
      StartTime,
      EndTime,
      type,
      virtual,
    } = JSON.parse(data);

    // format date and time to get accepted in DB
    TimeQueued = formattedDatetime(TimeQueued);
    StartTime = formattedDatetime(StartTime);
    EndTime = formattedDatetime(EndTime);

    // SQL query to retrieve the last inserted ID from appt_main table
    var sqlLastId = `SELECT apptid as keyid FROM appt_main ORDER BY apptid DESC LIMIT 1`;

    // Retrieve the last inserted ID from the appt_main table
    db.query(sqlLastId, async (err, result) => {
      if (err) {
        console.error("Error retrieving last ID from database:", err);
        res.status(500).send("Internal Server Error");
      } else {
        let nextID;
        console.log("Returned id: ", result);

        if (result.length > 0) {
          // Extract the last inserted ID from the result
          const lastID = result[0].keyid;

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

        var apptid = nextID;
        var appt_set = {
          pxid,
          clinicid,
          doctorid,
          apptid,
          status,
          TimeQueued,
          QueueDate,
          StartTime,
          EndTime,
          type,
          virtual,
        };

        let node =
          location == "luzon" ? connect.luzon_node : connect.vismin_node;

        await connect.dbQuery(
          node,
          `INSERT INTO appt_main SET ?`,
          appt_set,
          (err, res) => {
            if (err) {
              console.log(err);
              res.status(500).send("Error: appointment was not registered.");
            } else {
              console.log("Appointment successfully submitted");
              res.status(200).send();
            }
          }
        );
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

///////////////// DRAFT //////////////////////////

// import express from "express";
// import bodyParser from "body-parser";
// import mysql from "mysql2";
// import connect from "../connect.js"
// import "dotenv/config";

// const LOCAL_DB_PASSWORD = process.env.LOCAL_DB_PASSWORD;

// const app = express();
// app.use(bodyParser.json());

// //use function to check connections to 3 nodes
// //checkConnections();

// // use function to view 10 doctors
// // viewDoctors()

// const controller = {
//   getHome: async function (req, res) {
//     let connection = await conn.node_1.getConnection();
//     res.render("home", {
//       maincss: "/static/css/main.css",
//       mainscript: "/static/js/home.js",
//     });
//   },

// };

// export default controller;
