const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');


let Paste = require('../models/paste');
let User = require('../models/user');

router.get('/paste/new', ensureAuthenticated, (req, res) => {
  res.render('addPaste', {
    title:'New Paste'
  });

});

router.post('/paste/new', ensureAuthenticated,(req, res) => {
	let paste = new Paste();
	paste.title = req.body.pasteTitle;
	paste.body = req.body.pasteBody;
	paste.author = req.user._id;
	if (req.body.passwordCheckbox === 'on' && req.body.pastePassword !== 'undefined') {
		if (req.body.pastePassword.length > 0) {
			paste.password = req.body.pastePassword;
		}	
	}
	paste.save((err) => {
		if (err) {
			console.log(err);
			req.flash('warning', 'Hmm, something went wrong!')
			res.redirect('/');
		}else{
			req.flash('success', 'Paste created successfully!')
			res.redirect(`/paste/${paste._id}`);
		}
	});

});


router.get('/paste/:id/edit', ensureAuthenticated, (req, res) => {
	Paste.findById(req.params.id, (err, paste) => {
		if (err) {
			console.log(err);
			req.flash('warning', 'Hmm, something went wrong!')
			res.redirect('/');
		}
		if (paste) {
			if (paste.author === req.user.id) {
				res.render('addPaste', {
			    	paste,
			    	edit: true
			  	});
			}else{
				req.flash('danger', 'Hmm, you can\'t do that!');
				res.redirect("/");
			}
		}else{
			res.redirect("/");
		}
	});
	
});

router.post('/paste/:id/edit', ensureAuthenticated, [
	check('pasteTitle')
	.isLength({ max: 100 }).withMessage('Title can\'t have more than 100 characters.'),
	check('pasteBody')
	.isLength({ min: 10 }).withMessage('Your paste can\'t have less than 10 characters.')
	.isLength({ max: 10000 }).withMessage('Your paste can\'t have more than 10 000 characters.')
	], (req, res) => {

	let errors = validationResult(req);
	if (!errors.isEmpty()) {
		errors.array().forEach((err, index) => {
			req.flash(`danger ${index}`, err.msg);
		});
		res.render('addPaste', {
	    	paste: {
	    		title:req.body.pasteTitle,
	    		body:req.body.pasteBody,
	    		password: req.body.pastePassword ? req.body.pastePassword : null
	    	},
	    	edit: true
	  	});
	}else{
		/*If you're worried about performance you could use Paste.findOneAndUpdate({$and: [ {'_id':req.params.id}, {'author': req.user.id}]}, paste, (err, paste) => {}); instead*/
		/* I did it this way so I could check the paste owner and send the proper error if he's not allowed to edit the paste, with findOneAndUpdate I can't do that, or at least I don't know how */
		Paste.findById(req.params.id, (err, paste) => {
			if (err) {
				// console.log(err)
				req.flash('warning', 'Hmm, something went wrong!')
				res.redirect('/');
			}else{
				if (paste.author !== req.user.id) {
					req.flash('danger', 'Hmm, you are not allowed to edit that paste!')
					res.redirect('/');
				}else{
					let paste = {
						title: req.body.pasteTitle,
						body: req.body.pasteBody
					};
					if (req.body.passwordCheckbox === 'on' && req.body.pastePassword !== 'undefined') {
						if (req.body.pastePassword.length > 0) {
							paste.password = req.body.pastePassword;
						}	
					}else{
						paste.password = null;
					}
					Paste.update({'_id':req.params.id}, paste, err => {
						if (err) {
							// console.log(err)
							req.flash('warning', 'Hmm, something went wrong!')
							res.redirect(`/paste/${req.params.id}`);
						}else{
							req.flash('success', 'Paste edited successfully!')
							res.redirect(`/paste/${req.params.id}`);
						}
					})
				}
			}

		});
	}
	
});


router.delete('/paste/:id/delete', ensureAuthenticated, (req, res) => {
  	Paste.findById(req.params.id, (err, paste) => {
		if (err) {
			console.log(err);
			res.status(404).send();
		}
		if(paste.author !== req.user.id){
			res.status(500).send();
		} else {
			Paste.remove({_id: req.params.id}, err => {
				if(err){
					console.log(err);
				}else{
					res.redirect("/");
				}
			});
		}	
	});
	
});

router.get('/paste/:id', (req, res) => {
	let userid = req.user ? req.user.id : "";
	Paste.findById(req.params.id, (err, paste) => {
		if (err) {
			console.log(err);
			req.flash('warning', 'Hmm, something went wrong!')
			res.redirect('/');
		}else{
			if (paste) {
				User.findById(paste.author, (err, user) => {
					if (!err) {
						if (paste.password && paste.author !== userid) {
							res.render('pastepsw', {
						    	id: paste.id
						  	});
						}else{
							res.render('paste', {
						    	paste,
						    	author: user.username
						  	});
						}
					}
				})
			}else{
				req.flash('danger', 'Paste does not exist')
				res.redirect("/");
			}
		}
	});
	
});


router.post('/paste/:id', (req, res) => {
	Paste.findById(req.params.id, (err, paste) => {
		if (err) {
			console.log(err);
			req.flash('warning', 'Hmm, something went wrong!')
			res.redirect('/');
		}else{
			if (paste) {
				User.findById(paste.author, (err, user) => {
					if (!err) {
						if (paste.password !== req.body.password) {
							req.flash('danger', 'Wrong password')
							res.redirect(`/paste/${req.params.id}`);
						}else{
							res.render('paste', {
						    	paste,
						    	author: user.username
						  	});
						}
					}
				})
			}else{
				req.flash('danger', 'Paste does not exist')
				res.redirect("/");
			}
		}
	});
	
});


function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
    req.flash('danger', 'Please login first!');
    req.session.redirectTo = req.url;
    res.redirect('/login');
}

module.exports = router;