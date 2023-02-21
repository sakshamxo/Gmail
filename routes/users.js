const mongoose = require('mongoose');
const plm = require('passport-local-mongoose')
mongoose.connect('mongodb://localhost/test');

const userSchema = mongoose.Schema({
  username:String,
  name:String,
  password:String,
  email:{
    type: String,
    unique: true
  },
  profilepic:{
    type:String,
    default:"def.jpg"
  },
  mobile:String,
  sentMails:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:'mail'
  }],
  receivedMails:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:'mail'
  }]
})

userSchema.plugin(plm);
module.exports = mongoose.model('user',userSchema);

