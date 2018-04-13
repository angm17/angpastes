module.exports = (req, res, next) => {
  if(req.isAuthenticated()){
    return next();
  }
    req.flash('danger', 'Please login first!');
    req.session.redirectTo = req.url;
    res.redirect('/login');
}