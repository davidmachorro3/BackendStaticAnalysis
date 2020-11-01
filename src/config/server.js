const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());
app.set("PORT",3400);
module.exports = app;