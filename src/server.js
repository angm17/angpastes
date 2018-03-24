//////////////////////*********************DEPENDENCIES********************////////////////////////////
const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const config = require('./config/database');
const time = require('moment');
const passport = require('passport');
const session = require('express-session');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const expressMessages = require('express-messages')
//////////////////////*********************DATABASE CONECCTION********************////////////////////////////
mongoose.connect(config.database);
let db = mongoose.connection;

//////////////////////*********************WEBSITE NAME********************////////////////////////////
const SITENAME = "AngPastes";
let Paste = require('./models/paste');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
  secret: 'And your secret is?!!!',
  resave: true,
  saveUninitialized: true
}));

app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = expressMessages(req, res);
  next();
});

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
//////////////////////*********************GLOBAL VARIABLES********************////////////////////////////

app.use((req, res, next) => {
  res.locals.SITENAME = SITENAME;
  res.locals.time = time;
  res.locals.user = req.user || null;
  next();
});


app.get('/', (req, res) => {
  if (req.user) {
    Paste.find({author: req.user.id}, (err, pastes) => {
      if (!err) {
        res.render('pastes', {pastes})
        //res.render('addPaste');
      }
    })
  }else{
    res.render('loginReg', {
    title:"Login",
    header:false,
    footer:false,
    type:'login'
  });
  }
  
});

//Routers
let userAuth = require('./routes/userAuth.js');
let pastes = require('./routes/pastes.js');


app.use(pastes);
app.use(userAuth);


app.get('*', function(req, res, next) {
    res.redirect('/');
    next();
});

app.listen(3000, (err) => {
	if (err) {
		console.log(err);
	}else{
		console.log('Server started on port 3000...');
	}
});
