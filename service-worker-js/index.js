const google = require('googleapis')
const amqplib = require('amqplib');
const User = require('./userModel')
const axios = require('axios')
const mongoose = require('mongoose')
require('dotenv').config()

const frontEndUrl = process.env.FRONT_END_URL;
const gmailBaseApiUrl = process.env.GMAIL_BASRE_API_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URL;
const mongoUri = process.env.MONGO_URI;
const rabbitMqUri = process.env.RABBITMQ_URI;

const oauth2Client = new google.google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  redirectUrl
);

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })

const axiosInstance = axios.create({
  baseURL: gmailBaseApiUrl,
})


async function do_consume() {
    await wait(30000)
    var conn = await amqplib.connect(rabbitMqUri, "heartbeat=60");
    var ch = await conn.createChannel()
    var q = 'email-delete';
    console.log('listening to queue');
    await conn.createChannel();
    await ch.assertQueue(q);
    await ch.consume(q, async function (msg) {
        await ch.ack(msg);
        await processMessage(msg)
        console.log('ack msg');
        }, {consumerTag: 'myconsumer'});
}

do_consume();

async function processMessage(msg) {
  console.log(JSON.parse(msg.content));
  await handleEmailDelete(JSON.parse(msg.content))
}

async function setNewAccessToken(userId, axiosInstance){
  const user = await User.findOne({userId})
  oauth2Client.setCredentials({
    refresh_token: user.refreshToken
  })
  const newAccessToken = await oauth2Client.getAccessToken()
  console.log(newAccessToken);
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken.res.data.access_token}`
  return
}

async function handleEmailDelete(emailPayload){
  console.log(emailPayload);
  let count = 0
  try{

    let user = await User.findOne({userId: emailPayload.userId})
    console.log(user._doc);
    user = user._doc
    
    const emailList = user.emailList
    let pageToken = user.lastPageToken
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${emailPayload.token}`
    let emailIds = []
    let first = true
    while(emailIds.length>59|| first){
      console.log(count, pageToken);
      count++
      first = false
      emailIds.length = 0
      let emailFetch
      try{
        emailFetch = await axiosInstance.get(`gmail/v1/users/${emailPayload.userId}/messages`, {params: {maxResults: 60, pageToken}})
      }catch(err){
        await setNewAccessToken(emailPayload.userId, axiosInstance)
        emailFetch = await axiosInstance.get(`gmail/v1/users/${emailPayload.userId}/messages`, {params: {maxResults: 60, pageToken}}) 
      }
      pageToken = emailFetch.data.nextPageToken
      emailIds.push(...emailFetch.data.messages.map(message=>message.id))
      const batchEmailIds = createBatch(emailIds,10)
      
      for(let messages of batchEmailIds){
        const gatherResponses = []
        const emailsIdsToDelete = []
        let resps
        let settledFlag = true
        const messageResp = getMessageById(messages, emailPayload.userId)
        resps = await Promise.allSettled(messageResp)
        if(resps.map(res => {
          if(res.status != 'fulfilled') settledFlag = false
        }))
        if(!settledFlag){
          await wait(10000)
          await setNewAccessToken(emailPayload.userId, axiosInstance)
          resps = await Promise.allSettled(getMessageById(messages, emailPayload.userId))
        }
        gatherResponses.push(...resps)
        await wait(1000)
        console.log('waiting');
        
        if(emailList.length > 1){
          gatherResponses.map(response=>{
          const receiverEmailId = response.value.data.payload.headers.filter(header => header.name == 'From')[0]['value'].toLowerCase()
          emailList.map(email => receiverEmailId.includes(email) ? emailsIdsToDelete.push(response.value.data.id) : null)
          })
          console.log('emailsIdsToDelete.length', emailsIdsToDelete.length, pageToken);
          if(emailsIdsToDelete.length != 0){
            await deleteBatch(emailsIdsToDelete, emailPayload.userId)
            user = await User.findOne({userId: emailPayload.userId})
            await User.findByIdAndUpdate(user._id, {totalDeleted: user.totalDeleted + emailsIdsToDelete.length, lastPageToken: pageToken})
            console.log(user.totalDeleted + emailsIdsToDelete.length);
          }
          if(!pageToken) await sendEmail(user.email)
        }else{
          return
        }
      }
    }
  }catch(err){
    console.log(err);
  }
}

async function sendEmail(userEmail){
  //send completion email
}

async function wait(time){
  return new Promise((res,rej) => {
    setTimeout(res,time)
  })
}

async function deleteBatch(deleteBatch, userId){
  // for(let batch of deleteBatch){
  console.log('deleted', deleteBatch.length);
  let resp
  try{
    resp = await Promise.allSettled(deleteMessage(deleteBatch, userId))
    if(resp[0].status!= 'fulfilled'){
      await setNewAccessToken(userId, axiosInstance)
      await Promise.allSettled(deleteMessage(deleteBatch, userId))
    }
  }catch(err){
    await setNewAccessToken(userId, axiosInstance)
    await Promise.allSettled(deleteMessage(deleteBatch, userId))
  }
  // }
}

function deleteMessage(batch, userId){
  return batch.map(messages=> {
    return axiosInstance.post(`gmail/v1/users/${userId}/messages/batchDelete`,{ids:messages})
  })
}

function getMessageById(messages, userId){
  return messages.map(messageId => {
    return axiosInstance.get(`gmail/v1/users/${userId}/messages/${messageId}`) 
  })
}

function createBatch(data,batchSize){
  let i = 0;
  const batch = [];
  while (i < data.length) {
    batch.push(data.slice(i, i + batchSize));
    i += batchSize;
  }
  return batch;
}