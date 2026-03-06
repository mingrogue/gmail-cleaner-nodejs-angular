const express = require('express')
const cors = require('cors')
const jwtDecode = require('jwt-decode')
const googleapis = require('googleapis')
const axios = require('axios')
const User = require('./userModel')
const middleware = require('./middleware')
const utils = require('./utils')
const rabbit = require('./rabbit')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fs = require('fs')
const http = require('http');
const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const privateKey  = fs.readFileSync('./assets/key.pem', 'utf8');
const certificate = fs.readFileSync('./assets/cert.pem', 'utf8');
const frontEndUrl = process.env.FRONT_END_URL;
const gmailBaseApiUrl = process.env.GMAIL_BASRE_API_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URL;
const mongoUri = process.env.MONGO_URI

const credentials = {key: privateKey, cert: certificate};
const axiosInstance = axios.create({
  baseURL:gmailBaseApiUrl,
})

const app = express()
app.use(cors({
  // origin:['http://ec2-3-110-204-183.ap-south-1.compute.amazonaws.com:4201']
  origin:[frontEndUrl]
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,token");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    next();
});
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })

const oauth2Client = new googleapis.google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  // 'https://ec2-3-110-204-183.ap-south-1.compute.amazonaws.com:3001/token/'
  redirectUrl
);

// generate a url that asks permissions for Blogger and Google Calendar scopes
const scopes = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];


app.get('/login', async (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.send({url})
}) 


app.get('/token', async (req, res) => {
  if(!req.query.code && !req.query.scope) res.status(404)
  else{
    const {tokens} = await oauth2Client.getToken(req.query.code)
    oauth2Client.setCredentials(tokens);
    const decoded = jwtDecode.jwtDecode(tokens.id_token) 
    const email = decoded.email
    res.statusCode = 302;

    const fetchedUser = await User.findOne({email})
    
    if(!fetchedUser) {
      await User.create({
      createdOn:new Date(),
      email,
      isActive:true,
      emailList:[],
      name: decoded.name,
      picture: decoded.picture,
      userId: decoded.sub,
      totalDeleted: 0,
      refreshToken: tokens.refresh_token
    })}else{
      await User.findOneAndUpdate({email}, {refreshToken: tokens.refresh_token}).exec()
    }
    res.setHeader("Location", `http://localhost:4200/token/${tokens.access_token}&${email}`)
    res.send()
    res.end()
  }
})


app.get('/profile', async(req, res )=>{
  const profile = await User.findOne({email: req.query.email})

  res.status(200).json(profile)
})


app.get('/logout', async (req, res) => {
  await oauth2Client.revokeToken(req.query.token)

  res.send('logged out')
})

app.get('/get-access-token', async (req,res) => {
  const email = this.req.email
  const user = await User.findOne({email: email})

  oauth2Client.setCredentials({
    refresh_token: user.refreshToken
  })
  const token = await oauth2Client.getAccessToken()

  res.send(token).status(200)
})

app.get('/email/get-email-ids', middleware.validateToken, async(req,res)=>{
  const totalIds = parseInt(req.query.total)
  const totalEmails = []
  let pageToken = 0
  
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  while(totalEmails.length < totalIds){
    let emailIds = await axiosInstance.get(`gmail/v1/users/${query.userId}/messages`, {
      params:{pageToken, maxResults:50}
    })   

    totalEmails.push(...await utils.fetchUniqueEmails(emailIds.data.messages, query.userId))
  }

  res.json(totalEmails.slice(0,totalIds)).status(200)
})

app.get('/email/total-deleted', middleware.validateToken, async (req,res) => {
  const user = await User.findOne({email: req.query.userId})

  res.status(200).json(user.totalDeleted)
})

app.post('/email/delete', middleware.validateToken, async (req,res) => {
  const user = await User.findOne({email: req.query.userId})
  let emailList = [...req.body.emails]
  const usersEmailList = (await User.findOne({email: req.query.userId}))._doc.emailList

  usersEmailList.push(...emailList)
  await User.findOneAndUpdate({email: req.query.userId}, {emailList: usersEmailList})
  rabbit.publishMessage('email-delete', {emails:usersEmailList, userId: user.userId, emailId: user.email, token:req.headers.authorization.split(' ')[1]})

  res.status(200).json('done')
})

app.get('/user/:email', middleware.validateToken, async (req,res)=> {
  const user = await User.findOne({email: req.params.email})

  res.status(200).json(user)
})


// const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app)
// httpsServer.listen(3001, ()=> console.log('server listening to port 3001'))
httpServer.listen(3000, ()=> console.log('server listening to port 3000'))