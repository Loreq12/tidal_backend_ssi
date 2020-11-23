var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//var multer = require('multer');
var fileUpload = require('express-fileupload');
//var upload = multer();

//var bodyParser = require('body-parser')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/login');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));       //urlencoded form-data
//app.use(upload.array());                                        //normal form data CO^CHUJA sie tu dzieje
app.use(express.static('public'));
app.use(fileUpload())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRouter)
app.use('/api', usersRouter)
// app.use('/', indexRouter);
// app.use('/users', usersRouter);

module.exports = app;
