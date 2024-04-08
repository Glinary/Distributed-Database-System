import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const controller = {
  getHome: async function (req, res) {
    res.render("home", {
      maincss: "/static/css/main.css",
      mainscript: "/static/js/home.js",
    });
  },

};

export default controller;