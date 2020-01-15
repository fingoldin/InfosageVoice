"use strict";

const express = require("express");
const auth = require("express-basic-auth");
const bodyParser = require("body-parser");
const fulfillment = require("dialogflow-fulfillment");
const actions = require("./actions.js");

// Config
const listen_port = 3000;
const dialogflow_users = {
  "dialogflow": process.env.DIALOGFLOW_PASSWORD
};

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("success 2!");
});

app.post("/fulfillment", auth({ users: dialogflow_users }), (req, res) => {
  let client = new fulfillment.WebhookClient({ request: req, response: res });
  (actions.actionHandlers[client.action])(client);
});

app.listen(listen_port);
