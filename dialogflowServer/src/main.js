"use strict";

const express = require("express");
const auth = require("express-basic-auth");
const bodyParser = require("body-parser");
const fulfillment = require("dialogflow-fulfillment");
const intents = require("./intents.js");

// Config
const listen_port = 3000;
const dialogflow_users = {
  "dialogflow": process.env.DIALOGFLOW_PASSWORD
};

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("success 3");
});

let intentMap = intents.getIntentMap();

app.post("/fulfillment", auth({ users: dialogflow_users }), (req, res) => {
  //console.log("Original request: " + JSON.stringify(req.body));
  let client = new fulfillment.WebhookClient({ request: req, response: res });
  client.handleRequest(intentMap);
});

app.listen(listen_port);
