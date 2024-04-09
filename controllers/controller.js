import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2";
import connect from "../connect.js"

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

  getAppointments: async function (req, res) {
    
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
                  res.status(500).send('Error retrieving data from database');
              }
          }
      }
    }
    console.log("Getting data...");
    let node;
        
    await connectionReRoute();
    const [result] = await connect.dbQuery(node, "SELECT * FROM appt_main", []);
    const appointments = result.map(row => ({
      pxid: row.pxid,
      clinicid: row.clinicid,
      doctorid: row.doctorid,
      apptid: row.apptid,
      status: row.status,
      TimeQueued: row.TimeQueued,
      QueueDate: row.QueueDate,
      StartTime: row.StartTime,
      EndTime: row.EndTime,
      Virtual: row.Virtual
    }));

    if (node === connect.central_node) {
      //sample of how to read output
      appointments.forEach(appointment => {
        console.log(appointment.pxid);
      });
      
      res.render("home", {
      maincss: "/static/css/main.css",
      mainscript: "/static/js/home.js",
      });
    } else {
      const [result2] = await connect.dbQuery(node === connect.luzon_node ? connect.vismin_node : connect.luzon_node, "SELECT * FROM appt_main", []);
      const appointments2 = result2.map(row => ({
        pxid: row.pxid,
        clinicid: row.clinicid,
        doctorid: row.doctorid,
        apptid: row.apptid,
        status: row.status,
        TimeQueued: row.TimeQueued,
        QueueDate: row.QueueDate,
        StartTime: row.StartTime,
        EndTime: row.EndTime,
        Virtual: row.Virtual
      }));
      const combinedData = appointments.concat(appointments2);
      const uniqueData = [...new Map(combinedData.map(item => [item.id, item])).values()];
      uniqueData.sort((a, b) => a.id - b.id);
      //sample of how to read output
      appointments2.forEach(appointment2 => {
        console.log(appointment2.status);
      });
      res.render("home", {
        maincss: "/static/css/main.css",
        mainscript: "/static/js/home.js",
      });
    }
       
  },

  postAppointment: async function (req, res) {
    console.log("--- Adding appointment ---")
    let location = 'luzon'; //TODO: make a function to get if location if luzon or vismin
    //TODO: change to req.body dynamic (hardcoded for now to test)
    let pxid = '00000AAAAAAAAAAAAAAAAAAAAAAAAAAA';
    let clinicid = '00000HHHHHHHHHHHHHHHHHHHHHHHHHHH';
    let doctorid = '00000EEEEEEEEEEEEEEEEEEEEEEEEEEE';
    let apptid = '00000MMMMMMMMMMMMMMMMMMMMMMMMMMM';
    let status = 'Queued';
    let TimeQueued;
    let QueueDate;
    let StartTime;
    let EndTime;
    let type = 'Consultation';
    let Virtual = '0';

    //TODO: clarify how the times will bet set and changes in status
    const appt_set = { pxid, clinicid, doctorid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, Virtual};

    //TODO: uncomment once there are multiple nodes since adding to the same database will give a duplicate key error
    // update central node
    // await connect.dbQuery(connect.central_node, "INSERT INTO appt_main SET ?", appt_set, (err, result) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log("updated central node");
    //   }
    // })

    let node = location == 'luzon' ? connect.luzon_node : connect.vismin_node;

    //update subnode
    await connect.dbQuery(node, "INSERT INTO appt_main SET ?", appt_set, (err, res) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error: appointment was not registered.');
      } else {
        console.log('Appointment successfully submitted');
        
      }
    })  
    res.render("home", {
      maincss: "/static/css/main.css",
      mainscript: "/static/js/home.js",
    }); 
  },

};

function getCurrentDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
  const day = now.getUTCDate().toString().padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}T08:00:00.000Z`;
  return formattedDate;
}

export default controller;
