import express from "express";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import routes from "./routes/routes.js";
import "dotenv/config";
import connect from "./connect.js"

const port = process.env.PORT;

const app = express();
// Set public folder to 'public'
app.use("/static", express.static("public"));

app.engine("hbs", exphbs.engine({ extname: "hbs" }));
app.set("view engine", "hbs"); // set express' default templating engine
app.set("views", "./views");

//user bodyParser
app.use(bodyParser.json());

// use router
app.use(routes);

connect.listen_connections();

// activate the app instance
app.listen(port, () => {
  console.log(`Server is running at:`);
  console.log(`http://localhost:` + port);
});