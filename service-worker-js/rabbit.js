
//const amqp = require('amqplib/callback_api');
const amqp = require('amqplib');
const commonFunctions = require('../../utils/commonFunctions')
const executeDatabase = require('./database/executeDatabaseOperation')
const execute = require('../../execute')
const publisher = require('../publish')
const databaseStage = require('../database/database')
const mailer = require('../email/mailer')
const cassandra = require('cassandra-driver');
const saveStage = require('../../persist-to-database/save')
const uuid = require('uuid')



exports.executeListener = async (stage, rabbitObject) => {
  try{
    let url;
    if(rabbitObject.username.length > 1 && rabbitObject.password.length > 1){
      url = `amqp://${rabbitObject.username}:${rabbitObject.password}@${rabbitObject.host}:${rabbitObject.port}`
    }else{
      url = `amqp://${rabbitObject.host}:${rabbitObject.port}`
    }
    const response = connectRabbit(stage['resource'], stage, rabbitObject, processMessage);
    console.log(response);
    
    return
  }catch(err){
    console.log(err);
  }
}


const filterRabbitMessage = (stage, msgObj)=>{
  if(stage['listen-filter'] && stage['listen-filter'].length > 0){
    let pass = true
    stage['listen-filter'].map(filter => {
      if(msgObj[filter.field] !== filter.value){
        pass = false
      }
    })
    if(!pass){
      return null
    }else{
      return msgObj
    }
  }
}


const processMessage = async (stageFromExecute, rabbitObject, listenerMessageObj) => {
  let filteredMessageObj
  console.log('processing message');
  if(listenerMessageObj){
    if(stageFromExecute['output-filters']){
      filteredMessageObj = commonFunctions.filterOutput(listenerMessageObj, stageFromExecute['output-filters'])
    }else{
      filteredMessageObj = listenerMessageObj
    }
  }else{
    // console.log('inside else');
  }
  let operationOutput = filteredMessageObj
  console.log('--------------------------', filteredMessageObj);
  const runId = cassandra.types.timeuuid()
  const startTime = new Date()
  const userId = uuid.v4()
  const tenantId = uuid.v4()
  const igniterGroupId = uuid.v4()

  const jsonObject = {
    runId, startTime, userId, tenantId, igniterGroupId
  }


  console.log(operationOutput, 'message recieved');

  if(stageFromExecute.operations.length > 0){
    // await saveStage.persistToDatbase(mongoObjct)
    console.log('here');
    console.log('after connect');
    for(let operation of stageFromExecute.operations){
      if(operation.type === 'database'){
        operationOutput = await databaseStage.processDatabaseStage(operation, operationOutput, jsonObject)
      }
      if(operation.type === 'publish'){
        operationOutput = publisher.executePublisher(operation, rabbitObject, operationOutput, jsonObject)
      }
      if(operation.type === 'send-email'){
        console.log('here in email ');
        operationOutput = await mailer.sendMail(operation, operationOutput, jsonObject)
      }
    }
  }

  // setTimeout(function() {
  //   saveStage.client.shutdown(_ => {
  //     console.log('closed connection cassandra');
  //   })
  // }, 10000);
  return
}

const jsonParse = str => {
  try {
    return JSON.parse(str);
  } catch(err){
    console.log(err);
    throw err
  }
}

const connectRabbit = async (queue, stage, rabbitObject, callback) => {  
  let url
  if(rabbitObject.username.length > 1 && rabbitObject.password.length > 1){
    url = `amqp://${rabbitObject.username}:${rabbitObject.password}@${rabbitObject.host}:${rabbitObject.port}`
  }else{
    url = `amqp://${rabbitObject.host}:${rabbitObject.port}`
  }

  const connection = await amqp.connect(url)
  if(connection)
  {
    const channel = await connection.createChannel();
    channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    channel.consume(queue, function(msg) {
      //console.log(jsonParse(msg.content.toString()));
      callback(stage, rabbitObject, jsonParse(msg.content.toString())).then(_ => {
        setTimeout(function() {
          channel.ack(msg);
          return({"operation" : "success"})
        }, 100);
      }).catch(err => {
        setTimeout(function() {
          channel.nack(msg);
          return({"operation" : "failed"})
        }, 10000);
      })
    });
    
  }
  else
  {
    console.log("cannot connect to rabbit mq server");
    return({"operation" : "failed"})
  }

  /*
  amqp.connect(url, stage, function(err, connection) {
    if (err) {
      console.log("Error connecting to Rabbit MQ!", err);
      throw err;
    }
    if(connection) console.log("Connected to Rabbit MQ!");
    connection.createChannel(function(error, channel) {
      if (error) {
        console.log("Error in finding channel", error);
        throw error;
      }
      channel.assertQueue(queue, {
        durable: true
      });
      channel.prefetch(1);
      channel.consume(queue, function(msg) {
        // console.log(jsonParse(msg.content.toString()));
        callback(stage, rabbitObject, jsonParse(msg.content.toString())).then(_ => {
          setTimeout(function() {
            channel.ack(msg);
          }, 100);
        }).catch(err => {
          setTimeout(function() {
            channel.nack(msg);
          }, 10000);
        })
      });
    });
  });
  */
}