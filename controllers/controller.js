import express from "express";
import bodyParser from "body-parser";
import connect from "../connect.js";

const app = express();
app.use(bodyParser.json());

function formattedDatetime(timeString) {
  const [hours, minutes] = timeString
    .split(":")
    .map((part) => parseInt(part, 10));

  console.log("Hour Min", hours, minutes);
  // Create a new Date object with today's date and the specified time
  const today = new Date();
  today.setHours(hours + 8);
  today.setMinutes(minutes);
  today.setSeconds(0); // Set seconds to zero if you don't need them

  // Format the datetime string for MySQL (YYYY-MM-DD HH:MM:SS)
  const formattedDatetime = today.toISOString().slice(0, 19).replace("T", " ");
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
    const category = req.body.data;
    const pageNum = req.body.pageNum;
    const location = req.body.region;

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
    };

    //Search on the chosen node first before querying on central node, then fail if none
    async function connectionReRoute(node_num) {
      let connection;
      switch (node_num) {
        case 2: //user chose luzon region
          try {
            connection = connect.luzon_node.getConnection();
            node = connect.luzon_node;
          } catch (err) {
            try {
              connection = connect.central_node.getConnection();
              node = connect.central_node;
            } catch (err) {
              console.log(err);
              res.status(500).send("Error retrieving data from database");
            }
          }
          break;
        case 3: //user chose visayas/mindanao region
          try {
            connection = connect.vismin_node.getConnection();
            node = connect.vismin_node;
          } catch (err) {
            try {
              connection = connect.central_node.getConnection();
              node = connect.central_node;
            } catch (err) {
              console.log(err);
              res.status(500).send("Error retrieving data from database");
            }
          }
          break;
        default:
          try {
            connection = connect.central_node.getConnection();
            node = connect.central_node;
          } catch (err) {
            console.log(err);
            res.status(500).send("Error retrieving data from database");
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
    }
  },

  postAppointment: async (req, res) => {
    try {
      const location = req.body.region;

      const jsonData = req.body.json;
      const {
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
      } = JSON.parse(jsonData);

      // Format date and time values
      const formattedTimeQueued = formattedDatetime(TimeQueued);
      const formattedStartTime = formattedDatetime(StartTime);
      const formattedEndTime = formattedDatetime(EndTime);

      // Determine which database node to use based on location
      const node =
        location === "luzon" ? connect.luzon_node : connect.vismin_node;

      // SQL query to retrieve the last inserted ID from appt_main table
      const sqlLastId = `SELECT apptid as keyid FROM appt_main ORDER BY apptid DESC LIMIT 1`;

      // Retrieve the last inserted ID from the appt_main table
      const result1 = await connect.dbQuery(node, sqlLastId, []);
      let nextID;

      if (result1 && result1.length > 0) {
        const lastID = result1[0][0].keyid;
        // Convert the lastID from hexadecimal to a BigInt value
        const intValue = BigInt(`0x${lastID}`);
        // Increment the lastID value
        const nextValue = intValue + BigInt(1);
        // Convert the incremented value back to hexadecimal
        nextID = nextValue.toString(16);
        // Convert nextID to uppercase
        nextID = nextID.toUpperCase();
      } else {
        // If no records found, start with '1' as the next ID
        nextID = 1;
      }

      // Prepare the appointment data with the next available ID
      const apptid = nextID;
      const apptData = {
        pxid,
        clinicid,
        doctorid,
        apptid,
        status,
        TimeQueued: formattedTimeQueued,
        QueueDate,
        StartTime: formattedStartTime,
        EndTime: formattedEndTime,
        type,
        virtual,
      };

      // update the central node first
      try {
        const master_insertResult = await connect.dbQuery(
          connect.central_node,
          `INSERT INTO appt_main SET ?`,
          apptData
        );
        if (master_insertResult) {
          console.log("Appointment successfully added");
          //insert the appointment data into slave node if central is successful
          try {
            const insertResult = await connect.dbQuery(
              node,
              `INSERT INTO appt_main SET ?`,
              apptData
            );
            if (insertResult) {
              console.log("Appointment successfully added");
              res
                .status(200)
                .json({ message: "Successful adding of appointment" });
            }
          } catch (err) {
            console.error("Error adding appointment:", err);
            res.status(500).json({ message: "Failed to add appointment" });
          }
        } else {
          throw new Error("Failed to add appointment");
        }
      } catch (error) {
        console.error("Error adding appointment:", error);
        res.status(500).json({ message: "Failed to add appointment" });
      }
    } catch (error) {
      console.error("Error adding appointment:", error);
      res.status(500).json({ message: "Failed to add appointment" });
    }
  },

  getAllNewData: async function (req, res) {
    console.log("---HERE ALL NEW DATA---");
    const location = req.body.region;

    let node = location == "luzon" ? connect.luzon_node : connect.vismin_node;

    const sql = `select pxid, clinicid, doctorid, apptid, status, DATE_FORMAT(TimeQueued, "%l:%i %p") as "TimeQueued",  DATE_FORMAT(QueueDate, "%M %d, %Y") as "DateQueued", DATE_FORMAT(StartTime, "%l:%i %p") as "StartTime", DATE_FORMAT(EndTime, "%l:%i %p") as "EndTime", type as "Type", appt_main.virtual as "Virtual" FROM appt_main ORDER BY apptid DESC LIMIT 5;`;

    //TODO: check if priority node fails, it should connect on the central node
    const [result] = await connect.dbQuery(node, sql, []);
    if (isEmptyArray([result])) {
      const [master_result] = await connect.dbQuery(
        connect.central_node,
        sql,
        []
      );

      const master_latestRecords = master_result.map((row) => ({
        pxid: row.pxid,
        clinicid: row.clinicid,
        doctorid: row.doctorid,
        apptid: row.apptid,
        status: row.status,
        TimeQueued: row.TimeQueued,
        QueueDate: row.DateQueued,
        StartTime: row.StartTime,
        EndTime: row.EndTime,
        Virtual: row.Virtual,
      }));

      if (master_result) {
        res.status(200).json({ rows: master_latestRecords }).send();
      }
    }

    const latestRecords = result.map((row) => ({
      pxid: row.pxid,
      clinicid: row.clinicid,
      doctorid: row.doctorid,
      apptid: row.apptid,
      status: row.status,
      TimeQueued: row.TimeQueued,
      QueueDate: row.DateQueued,
      StartTime: row.StartTime,
      EndTime: row.EndTime,
      Virtual: row.Virtual,
    }));

    if (result) {
      res.status(200).json({ rows: latestRecords }).send();
    }
  },

  getDataCount: async function (req, res) {
    const category = req.body.category;
    const location = req.body.region;

    const categories = {
      doctors: "doctors",
      clinics: "clinics",
      patients: "px",
      undefined: "appt_main",
    };

    const node =
      location === "luzon" ? connect.luzon_node : connect.vismin_node;

    const sql = `SELECT COUNT(*) as count FROM ${categories[category]};`;
    // update central node
    const master_insertResult = await connect.dbQuery(
      connect.central_node,
      sql,
      []
    );
    if (master_insertResult) {
      console.log("INSERT: ", master_insertResult[0][0].count);

      // Insert the appointment data into the database
      const insertResult = await connect.dbQuery(node, sql, []);

      if (insertResult) {
        console.log("INSERT: ", insertResult[0][0].count);
        res.status(200).json({ rows: insertResult }).send();
      }
    }
  },

  getDoctors: async function (req, res) {
    //viewDoctors();
    res.render("home", {
      maincss: "/static/css/main.css",
      mainscript: "/static/js/home.js",
    });
  },

  editAppointment: async function (req, res) {
    console.log("--- Editing appointment ---");
    let location = req.body.region;

    const jsonData = req.body.json;
    const {
      apptid,
      status,
      TimeQueued,
      QueueDate,
      StartTime,
      EndTime,
      type,
      virtual,
    } = JSON.parse(jsonData);

    let node = location == "luzon" ? connect.luzon_node : connect.vismin_node;

    // Format date and time values
    const formattedTimeQueued = formattedDatetime(TimeQueued);
    const formattedStartTime = formattedDatetime(StartTime);
    const formattedEndTime = formattedDatetime(EndTime);

    const apptData = [
      status,
      formattedTimeQueued,
      QueueDate,
      formattedStartTime,
      formattedEndTime,
      type,
      virtual,
      apptid,
    ];
    // update central node first
    try {
      const master_result = await connect.dbQuery(
        connect.central_node,
        `UPDATE appt_main SET status = ?, TimeQueued = ?, QueueDate = ?, StartTime = ?, EndTime = ?, type = ?, appt_main.Virtual = ? WHERE apptid = ?`,
        apptData
      );

      if (master_result) {
        console.log("Appointment successfully updated");

        //update subnode
        try {
          const result = await connect.dbQuery(
            node,
            `UPDATE appt_main SET status = ?, TimeQueued = ?, QueueDate = ?, StartTime = ?, EndTime = ?, type = ?, appt_main.Virtual = ? WHERE apptid = ?`,
            apptData
          );
          if (result) {
            console.log("Appointment successfully updated");
            res
              .status(200)
              .json({ message: "Appointment successfully updated" });
          }
        } catch (err) {
          console.log(err);
          return res.status(500).send("Error: appointment was not updated");
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error: appointment was not updated");
    }
  },

  searchAppointment: async function (req, res) {
    console.log("--- Searching appointment ---");

    const location = req.body.region;

    let body = req.body.json;
    const { apptid } = JSON.parse(body);

    let node = location == "luzon" ? connect.luzon_node : connect.vismin_node;

    //TODO:check if it searches on central node once subnode fails
    //update subnode
    try {
      // Update subnode
      const [result] = await connect.dbQuery(
        node,
        `select pxid, clinicid, doctorid, apptid, status, DATE_FORMAT(TimeQueued, "%l:%i %p") as "TimeQueued",  DATE_FORMAT(QueueDate, "%M %d, %Y") as "DateQueued", DATE_FORMAT(StartTime, "%l:%i %p") as "StartTime", DATE_FORMAT(EndTime, "%l:%i %p") as "EndTime", type as "Type", appt_main.virtual as "Virtual" FROM appt_main where apptid = ?;`,
        [apptid]
      );

      if (isEmptyArray([result])) {
        const [master_result] = await connect.dbQuery(
          connect.central_node,
          `select pxid, clinicid, doctorid, apptid, status, DATE_FORMAT(TimeQueued, "%l:%i %p") as "TimeQueued",  DATE_FORMAT(QueueDate, "%M %d, %Y") as "DateQueued", DATE_FORMAT(StartTime, "%l:%i %p") as "StartTime", DATE_FORMAT(EndTime, "%l:%i %p") as "EndTime", type as "Type", appt_main.virtual as "Virtual" FROM appt_main where apptid = ?;`,
          [apptid]
        );
        //transfer to central since subnode failed
        if (master_result) {
          console.log("Appointment successfully updated");
          const master_appointments = master_result.map((row) => ({
            pxid: row.pxid,
            clinicid: row.clinicid,
            doctorid: row.doctorid,
            apptid: row.apptid,
            status: row.status,
            TimeQueued: row.TimeQueued,
            QueueDate: row.DateQueued,
            StartTime: row.StartTime,
            EndTime: row.EndTime,
            Type: row.Type,
            Virtual: row.Virtual,
          }));
          console.log(appointments);
          res.status(200).json({ appt: master_appointments });
        }
      }

      if (result) {
        console.log("Appointment searched succesfully");
        const appointments = result.map((row) => ({
          pxid: row.pxid,
          clinicid: row.clinicid,
          doctorid: row.doctorid,
          apptid: row.apptid,
          status: row.status,
          TimeQueued: row.TimeQueued,
          QueueDate: row.DateQueued,
          StartTime: row.StartTime,
          EndTime: row.EndTime,
          Type: row.Type,
          Virtual: row.Virtual,
        }));
        console.log(appointments);
        res.status(200).json({ appt: appointments });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error: appointment was not searched");
    }
  },

  deleteAppointment: async function (req, res) {
    console.log("--- Deleting appointment ---");

    let location = req.body.region;

    const apptids = req.body.json;
    const { apptid } = JSON.parse(apptids);

    let node = location == "luzon" ? connect.luzon_node : connect.vismin_node;

    try {
      // update central
      const master_result = await connect.dbQuery(
        connect.central_node,
        "DELETE FROM appt_main WHERE apptid = ?",
        apptid
      );

      if (master_result) {
        console.log("Appointment successfully deleted");

        try {
          // Update subnode
          const result = await connect.dbQuery(
            node,
            "DELETE FROM appt_main WHERE apptid = ?",
            apptid
          );

          if (result) {
            console.log("Appointment successfully deleted");
            res
              .status(200)
              .json({ message: "Appointment successfully deleted" });
          }
        } catch (err) {
          console.log(err);
          return res.status(500).send("Error: appointment was not deleted");
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error: appointment was not deleted");
    }
  },
};

function isEmptyArray(arr) {
  return Array.isArray(arr) && arr.length === 0;
}

export default controller;
