// NOTE: This file will be exported to controller.js but will serve as testing for now
// Use command 'npm run connect' to see of mySQL commands work.

//console.log("Central Node Host:", central_node.config.connectionConfig.host);

import mysql from 'mysql2/promise'
import "dotenv/config";

let node_host, node_user, node_password, node_database = [];

function switchConnection(node_number) {
  switch (node_number) {
    case -1:
      node_host = process.env.NODE_SELF_HOST;
      node_user = process.env.NODE_SELF_USER;
      node_password = process.env.NODE_SELF_PASS;
      node_database = process.env.NODE_SELF_NAME;
      break;
    case 1:
      node_host = process.env.CENTRAL_DB_HOST;
      node_user = process.env.CENTRAL_DB_USER;
      node_password = process.env.CENTRAL_DB_PASSWORD;
      node_database = process.env.CENTRAL_DB_NAME;
      break;
    case 2:
      node_host = process.env.LUZON_DB_HOST;
      node_user = process.env.LUZON_DB_USER;
      node_password = process.env.LUZON_DB_PASSWORD;
      node_database = process.env.LUZON_DB_NAME;
      break;
    case 3:
      node_host = process.env.VISMIN_DB_HOST;
      node_user = process.env.VISMIN_DB_USER;
      node_password = process.env.VISMIN_DB_PASSWORD;
      node_database = process.env.VISMIN_DB_NAME;
      break;
    default:
      
      node_host = process.env.NODE_SELF_HOST;
      node_user = process.env.NODE_SELF_USER;
      node_password = process.env.NODE_SELF_PASSWORD;
      node_database = process.env.NODE_SELF_NAME;
      break;
  }
}
switchConnection(process.env.NODE_NUM_CONFIGURATION);

const self_node = mysql.createPool({
  host: node_host,
  user: node_user,
  password: node_password,
  database: node_database,
  connectionLimit: 10,
});

const central_node = mysql.createPool({
  host: process.env.CENTRAL_DB_HOST,
  user: process.env.CENTRAL_DB_USER,
  password: process.env.CENTRAL_DB_PASSWORD,
  database: process.env.CENTRAL_DB_NAME,
  connectionLimit: 10,
});

const luzon_node = mysql.createPool({
  host: process.env.LUZON_DB_HOST,
  user: process.env.LUZON_DB_USER,
  password: process.env.LUZON_DB_PASSWORD,
  database: process.env.LUZON_DB_NAME,
  connectionLimit: 10,
});

const vismin_node = mysql.createPool({
  host: process.env.VISMIN_DB_HOST,
  user: process.env.VISMIN_USER,
  password: process.env.VISMIN_PASSWORD,
  database: process.env.VISMIN_NAME,
  connectionLimit: 10,
});

self_node.on('connection', (connection) => {
  console.log('Connected to MySQL database: ' + node_user + '@' + node_host + '/' + node_database);
});

self_node.on('error', (err) => {
  console.log(`Error connecting to database of self: ${err}`);
});

central_node.on('connection', (connection) => {
  console.log('Connected to MySQL database: ' + process.env.CENTRAL_DB_USER + '@' + process.env.CENTRAL_DB_HOST + '/' + process.env.CENTRAL_DB_NAME);
});

central_node.on('error', (err) => {
  console.log(`Error connecting to database of Node 1: ${err}`);
});

luzon_node.on('connection', (connection) => {
  console.log('Connected to MySQL database: ' + process.env.LUZON_DB_USER + '@' + process.env.LUZON_DB_HOST + '/' + process.env.LUZON_DB_NAME);
});

luzon_node.on('error', (err) => {
  console.log(`Error connecting to database of Node 1: ${err}`);
});

vismin_node.on('connection', (connection) => {
  console.log('Connected to MySQL database: ' + process.env.VISMIN_DB_USER + '@' + process.env.VISMIN_DB_HOST + '/' + process.env.VISMIN_DB_NAME);
});

vismin_node.on('error', (err) => {
  console.log(`Error connecting to database of Node 1: ${err}`);
});

async function getConnection(pool) {
  return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
          if (err) {
              return reject(err);
          }
          resolve(connection);
      });
  });
}


// This function queries the database using transactions
async function dbQuery(pool, query, content, callback) {
  let connection;
  try {
      // Get a database connection from the pool
      connection = await pool.getConnection();

      // Begin the transaction
      await connection.beginTransaction();

      // Perform the query within the transaction
      const result = await connection.query(query, content);

      // Commit the transaction
      await connection.commit();

      // Release the database connection back to the pool
      connection.release();

      return result

  } catch (err) {
      console.log("Error in querying transactions:", err);

      // Feature: Rollback when there is an error
      if (connection) await connection.rollback();

      let query_type = query.split(" ")[0];
      if (process.env.NODE_NUM_CONFIGURATION != 1 && query_type != "SELECT")
          await storeQuery(pool, query, content);

      callback(err);

      throw err;
  } finally {
      // Release the database connection back to the pool
      if (connection) {
          connection.release();
      }
  }
}

async function storeQuery(dbPool, query, content) {
  let t_type = query.split(" ")[0];   // Get the first word of the query
  let t_dest = [];    // Destination node(s) for the transaction

  console.log("STORING FAILED TRANSACTION: "+query+content);

  let connection = await self_node.getConnection();

  // Determine the destination node(s) for the transaction   
  if (dbPool == central_node) { t_dest = 1; }
  else if (dbPool == luzon_node) { t_dest = 2; }
  else if (dbPool == vismin_node) { t_dest = 3; }
  else {
      t_dest = -1
      console.log("Error: Unknown hostname");
  }

  // Insert into local logs
  let localQuery = "INSERT INTO appt_logs (pxid,clinicid,doctorid,apptid,status,TimeQueued,QueueDate,StartTime,EndTime,type,Virtual,t_type,t_dest) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  let localContent = [content.pxid, content.clinicid, content.doctorid, content.apptid, content.status, content.TimeQueued, content.StartTime, content.EndTime, content.type, content.Virtual, t_type, t_dest];

  let queryConnection = await self_node.getConnection();

  await queryConnection.query(localQuery, localContent, (err, result) => {
      if (err) {
          console.log(err);
      } else {
          console.log("Local log inserted: "+result);
      }
  });

  // Close
  connection.release();
  queryConnection.release();
}

async function recoverTransactions(connection) {
  const [central_node_logs] = await grabLogsOfPool(central_node);
  const [luzon_node_logs] = await grabLogsOfPool(luzon_node);
  const [vismin_node_logs] = await grabLogsOfPool(vismin_node);

  // Database Recovery
  console.log ("Recovering transactions...")
  // Logs
  console.log("Central Node Logs: "+central_node_logs);
  console.log("Luzon Node Logs: "+luzon_node_logs);
  console.log("Visayas Mindanao Logs: "+vismin_node_logs);

  // Inserts the logs into the database
  for (let i = 0; i < 3; i++) {
      let node_logs = [];
      switch(i) {
          case 0:
              node_logs = central_node_logs;
              break;
          case 1:
              node_logs = luzon_node_logs;
              break;
          case 2:
              node_logs = vismin_node_logs;
              break;
          default:
              console.log("Error: Unknown node");
              break;
      }

      for (let j = 0; j < node_logs.length; j++) {
          let log = node_logs[j];

          let logsSourceNode = [];
          if (i == 0) logsSourceNode = central_node;
          else if (i == 1) logsSourceNode = luzon_node;
          else if (i == 2) logsSourceNode = vismin_node;

          // Commit the transaction
          commitTransaction(log, logsSourceNode);
      }
  }
}

async function grabLogsOfPool(dbPool) {
  console.log("GRABBING LOGS")
  let logs = [];

  let connection = await dbPool.getConnection();

  const result = await dbPool.query("SELECT * FROM appt_logs");

  connection.release();

  for (let i = 0; i < result.length; i++) {
      logs.push(result[i]);
  }

  console.log("ACQUIRED LOGS")
  return logs;
}

// This function is used to commit a transaction to the database.
// log - node to be commited
// currnode - active node
async function commitTransaction(log, currnode) {
  

  let query = "INSERT INTO appt_main (pxid,clinicid,doctorid,apptid,status,TimeQueued,QueueDate,StartTime,EndTime,type,Virtual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  let content = [log.pxid, log.clinicid, log.apptid, log.status, log.TimeQueued, log.StartTime, log.EndTime, log.type, log.Virtual];

  //Set destination node
  let connection;
  if (log.T_Dest == 1) connection = await central_node.getConnection();
  else if (log.T_Dest == 2) connection = await luzon_node.getConnection();
  else if (log.T_Dest == 3) connection = await vismin_node.getConnection();
  else {
      console.log("Error: Unknown destination node");
      console.log(log);
  }

  //Commit the transaction
  console.log("Committing transaction: "+query+" : "+content);
  await connection.query(query, content, (err, result) => {
      if (err) {
          console.log(err)
      } else {
          console.log("Recovered transaction: "+result);

          // Delete the log from the local logs
          let deleteQuery = "DELETE FROM appt_logs WHERE apptid = ?";
          let deleteContent = [log.apptid];
          let deleteNode = currnode;

          deleteNode.query(deleteQuery, deleteContent, (err, result) => {
              if (err) {
                  console.log('Error during log deletion: ')
                  console.log(err);
              } else {
                  console.log("Local log deleted: "+result);
              }
          });
      }
  });
}


// To avoid fragments or crashes, we need to make sure
// we close the connection pool when the process is terminated
function gracefulShutdown(node) {
  node.end(function (err) {
      if (err) {
          console.error('Error while closing connection pool:', err);
      }
      console.log("Shutting down gracefully");
  });
}

//TODO: update to export latest functions
const connect = {
  switchConnection,
  getConnection,
  dbQuery,
  commitTransaction,
  gracefulShutdown,
  self_node, 
  central_node,
  luzon_node,
  vismin_node
};

// Export the object containing all functions and central_node
export default connect;