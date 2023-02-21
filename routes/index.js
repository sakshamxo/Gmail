var express = require('express');

const passport = require('passport')
var router = express.Router();
const userModel = require('./users')
const mailModel = require('./mail')
const localstrategy = require('passport-local');
const { populate } = require('./users');
const multer = require('multer')
passport.use(new localstrategy(userModel.authenticate()));

function fileFilter (req, file, cb) {

    if( file.mimetype === "image/jpg" || file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/webp" ){
        cb(null,true);
    }else{
         cb(new Error('bht tez chal riya hai mc!'))
    }
    
  }
  

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
     const fn = Date.now() + Math.floor(Math.random() * 100000000) + file.originalname
      cb(null, fn)
    }
  })
  
  const upload = multer({ storage: storage , fileFilter: fileFilter})

router.get("/",redirecttoprofile,function(req,res,next){
    res.render('index')
})
router.post('/',function(req,res,next){
   var userdata = new userModel({
        username: req.body.username,
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile
    })
    userModel.register(userdata,req.body.password)
    .then(function(createduser){
        passport.authenticate('local')(req,res,function(){
            res.redirect('/profile')
        })
        
    })
    .catch(function(err){
        res.send(err)
    })
})
router.post('/login',passport.authenticate('local',{
    successRedirect: '/profile',
    failureRedirect:'/'  
}),function(req,res){});

router.get('/logout',function(req,res){
    req.logout(function(err){
        if (err) throw err;
        res.redirect('/login')
    })
});

router.get('/login',redirecttoprofile,function(req,res){
    res.render('login')
})
router.get('/profile',isloggedIn,async function(req,res,next){
 const loggedinuser = await userModel
 .findOne({username: req.session.passport.user })
 .populate({
    path:'receivedMails',
    populate:{
        path:'userid'
    }
 })
    .then(function(founduser){
        res.render('profile',{founduser});
    })
  
});
router.post('/compose',isloggedIn, async function(req,res,next){
    const loggedinuser = await userModel.findOne({username: req.session.passport.user})
    const createdmail = await mailModel.create({
        userid: loggedinuser._id,
        receiver:req.body.receiveremail,
        emailtext:req.body.emailtext
    })
    loggedinuser.sentMails.push(createdmail._id);
    const loggedinuserupdate = await loggedinuser.save();
    
    const receiveruser = await userModel.findOne({email: req.body.receiveremail}) 
    receiveruser.receivedMails.push(createdmail._id);
    const receiveruserupdate = await receiveruser.save();
    res.redirect(req.headers.referer)
    
})

router.get('/sent',isloggedIn, async function(req,res){
 const loggedinuser = await userModel.findOne({username : req.session.passport.user})
 .populate({
    path: 'sentMails',
    populate:{
        path:'userid'
    }
 })

    res.render('sentmail', {user:loggedinuser})
})

router.get('/read/mail/:id',isloggedIn,async function(req,res){
    const loggedinuser = await userModel.findOne({username : req.session.passport.user})
    let mailview = await mailModel.findOne({_id: req.params.id})
    .populate('userid')
    mailview.read = true;
    await mailview.save();
    res.render('readmail',{data:mailview,user:loggedinuser})
})

router.get('/delete/mail/:id',isloggedIn,async function(req,res){
    const loggedinuser = await userModel.findOne({username: req.session.passport.user})
    const maildata = await mailModel.findOne({_id:req.params.id})
    loggedinuser.sentMails.pop(maildata._id);
    const loggedinuserupdate = await loggedinuser.save();
    
    const logginuser = await userModel.findOne({username: req.session.passport.user})
    logginuser.receivedMails.pop(maildata._id);
    const logginuserupdate = await logginuser.save();
    res.redirect(req.headers.referer)
})

router.post('/picupload',isloggedIn,upload.single('pic'),async function(req,res){
   let loggedinuser = await userModel.findOne({username: req.session.passport.user})
    loggedinuser.profilepic = req.file.filename;
    await loggedinuser.save();
    res.redirect(req.headers.referer)

})

router.get('/check/:username',async function(req,res){
    const loggedinuser = await userModel.findOne({username: req.params.username})
    res.json({loggedinuser})
})

router.get('/checke/:email',async function(req,res){
    const loggemail = await userModel.findOne({email:req.params.email})
    res.json({loggemail})
})

function isloggedIn(req,res,next){
    if (req.isAuthenticated()){
        return next();
    }
    else{
        res.redirect('/login')
    }
}
function redirecttoprofile(req,res,next){
    if (req.isAuthenticated()){
        res.redirect('/profile')
    }
    else{
        return next();
    }
}
module.exports = router;
  