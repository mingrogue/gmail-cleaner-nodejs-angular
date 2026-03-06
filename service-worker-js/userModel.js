const mongoose = require('mongoose')
const Schema   = mongoose.Schema



const UserSchema = new Schema({
  name: String,
  email: String,
  picture: String,
  userId: String,
  emailList: Array,
  createdOn: String,
  isActive: Boolean,
  totalDeleted: Number,
  refreshToken: String
})

const User = mongoose.model('user', UserSchema)
module.exports = User