const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const ensureAuthenticated = require('../config/isAuth');
let User = require('../models/user');

router.get('/register', (req, res) => {
  res.render('loginReg', {
  	title:"New Account",
    header:false,
    footer:false,
    type:'register'
  });
});

router.post('/register', [
  check('username')
  .isLength({ min: 4 }).withMessage('Username must be at least 4 characters long.')
  .isLength({ max: 10 }).withMessage('Username can\'t be longer than 10 characters.')
  .isAlphanumeric().withMessage('Username can only contain letters and numbers'),
  check('email')
  .isEmail().withMessage('Email must be a correct email.'),
  check('password')
  .isLength({ min: 4, max: 10 }).withMessage('Password must be between 4 and 10 characters long.')
  .custom((value, { req }) => value === req.body.password2).withMessage('Passwords do no match.')
  ] ,(req, res) => {
    User.findOne({$or:[{username: new RegExp(`^${req.body.username}$`, "i")}, {email: new RegExp(`^${req.body.email}$`, "i")}]}, (err, user) => {
      if (err) {
        console.log(err);
        return;
      }
      if (user) {
        if (user.username.toLowerCase() === req.body.username.toLowerCase()) {
          req.flash('danger 1','The username is already in use');
        }
        if (user.email.toLowerCase() === req.body.email.toLowerCase()) {
          req.flash('danger 0','The email address is already in use');
        }
        res.render('loginReg', {
          SITENAME: res.locals.SITENAME,
          title:"New Account",
          header:false,
          footer:false,
          type:'register',
          form: {username: req.body.username, email: req.body.email}
        });
      }else{
        //User does not exist;
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
          errors.array().forEach((err, index) => {
            req.flash(`danger ${index}`, err.msg);
          });
          res.render('loginReg', {
          SITENAME: res.locals.SITENAME,
          title:"New Account",
          header:false,
          footer:false,
          type:'register',
          form: {username: req.body.username, email: req.body.email}
        });
          
        }else{
          let user = new User(matchedData(req));
          bcrypt.genSalt(10, (err, salt) => {
            if (!err) {
              bcrypt.hash(req.body.password, salt, (err, hash) => {
                if (!err) {
                  user.password = hash;
                  user.save(err => {
                    if(err){
                      console.log(err);
                      return;
                    } else {
                      req.flash('success','You are now registered and can log in');
                      res.redirect('/login');
                    }
                  });
                }else{
                  console.log(err);
                }
              });
            }
        });          
        }
        

      }
    });
});

router.get('/login', (req, res) => {
  res.render('loginReg', {
    title:"Login",
    header:false,
    footer:false,
    type:'login'
  });
});

router.post('/login', (req, res, next) => {
  let redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
  delete req.session.redirectTo;
  passport.authenticate('local', {
    successRedirect: redirectTo,
    failureRedirect:'/login',
    failureFlash : true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  // req.flash('success', 'You are logged out');
  res.redirect('/login');
});



/*User config*/

router.get('/config', ensureAuthenticated, (req, res) =>{
  res.render('userconfig');
})


router.post('/config/password', [
  ensureAuthenticated,
  check('currentPassword')
  .custom((value, { req }) => bcrypt.compareSync(value, req.user.password)).withMessage('Current Password is incorrect'),
  check('password')
  .isLength({ min: 4, max: 10 }).withMessage('Your new password must be between 4 and 10 characters long.')
  .custom((value, { req }) => value === req.body.password2).withMessage('New password do no match.')
  ] , (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((err, index) => {
        req.flash(`danger ${index}`, err.msg);
      });
      res.redirect('/config');
    }else{
      bcrypt.genSalt(10, (err, salt) => {
        if (!err) {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) {
              throw err;
            }
            User.update({'_id':req.user.id}, {$set: { 'password': hash} }, err => {
              if (err) {
                throw err;
              }
              req.flash('success', 'Password edited successfully!')
              res.redirect(`/config`);
              
            });
          });
        }
      }); 
    }

});


router.post('/config/email', ensureAuthenticated, (req, res) => {
  req.flash('danger', 'This form is not working yet.')
  res.redirect(`/config`);
})
router.post('/config/delete', ensureAuthenticated, (req, res) => {
  req.flash('danger', 'This form is not working yet.')
  res.redirect(`/config`);
})
module.exports = router;