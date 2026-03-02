var express = require("express");
var bodyParser = require("body-parser");
var fileUpload = require("express-fileupload");
var session = require("express-session");
var flash = require('express-flash');
var util = require("util");
require("dotenv").config();

var common_routes = require("./routes/common");
var admin_routes = require("./routes/admin");
var company_routes = require("./routes/company");
var employee_routes = require("./routes/employees");
var app = express();
// Serve company logos from public/company_logo folder
app.use('/company_logo', express.static('public/company_logo'));
app.use('/employee_photo', express.static('public/employee_photo'));
app.use('/employee_resume', express.static('public/employee_resume'));

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use(flash());


app.use("/", common_routes);
app.use("/admin", admin_routes);
app.use("/company", company_routes);
app.use("/employees", employee_routes);
app.listen(process.env.PORT || 1000, function () {
    console.log("server started");
});