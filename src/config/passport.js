const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcryptjs');
  
module.exports = passport => {
  passport.use(new LocalStrategy({passReqToCallback: true} , (req, username, password, done) => {
    User.findOne({username:username}, (err, user) => {
      if(err) throw err;
      if(!user){
        return done(null, false, req.flash('danger', 'User not found'));
      }
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, req.flash('danger', 'The password is incorrect.'));
        }
      });
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
}