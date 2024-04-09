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

    await connectionReRoute();
    const [result] = await connect.dbQuery(
      node,
      "SELECT * FROM appt_main LIMIT 15",
      []
    );

    if (node === connect.central_node) {
      //sample of how to read output
      console.table(result);
      res.status(200).json({ rows: result });
    } else {
      const [result2] = await connect.dbQuery(
        node === connect.luzon_node ? connect.vismin_node : connect.luzon_node,
        "SELECT * FROM appt_main LIMIT 15",
        []
      );

      console.table(result);
      res.status(200).json({ rows: result });

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
            res.status(500).send("Error retrieving data from database");
          }
        }
      }
    }
    console.log("Getting data...");
    let node;

    await connectionReRoute();
    const [result] = await connect.dbQuery(node, "SELECT * FROM appt_main", []);
    const appointments = result.map((row) => ({
      pxid: row.pxid,
      clinicid: row.clinicid,
      doctorid: row.doctorid,
      apptid: row.apptid,
      status: row.status,
      TimeQueued: row.TimeQueued,
      QueueDate: row.QueueDate,
      StartTime: row.StartTime,
      EndTime: row.EndTime,
      Virtual: row.Virtual,
    }));

    if (node === connect.central_node) {
      //sample of how to read output
      appointments.forEach((appointment) => {
        console.log(appointment.pxid);
      });

      res.render("home", {
        maincss: "/static/css/main.css",
        mainscript: "/static/js/home.js",
      });
    } else {
      const [result2] = await connect.dbQuery(
        node === connect.luzon_node ? connect.vismin_node : connect.luzon_node,
        "SELECT * FROM appt_main",
        []
      );
      const appointments2 = result2.map((row) => ({
        pxid: row.pxid,
        clinicid: row.clinicid,
        doctorid: row.doctorid,
        apptid: row.apptid,
        status: row.status,
        TimeQueued: row.TimeQueued,
        QueueDate: row.QueueDate,
        StartTime: row.StartTime,
        EndTime: row.EndTime,
        Virtual: row.Virtual,
      }));
      const combinedData = appointments.concat(appointments2);
      const uniqueData = [
        ...new Map(combinedData.map((item) => [item.id, item])).values(),
      ];
      uniqueData.sort((a, b) => a.id - b.id);
      //sample of how to read output
      appointments2.forEach((appointment2) => {
        console.log(appointment2.status);
      });
      res.render("home", {
        maincss: "/static/css/main.css",
        mainscript: "/static/js/home.js",
      });
    }
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
