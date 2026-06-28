const amqplib = require("amqplib");
const User = require("./userModel");
const axios = require("axios");
const mongoose = require("mongoose");
const {
  createBatch,
  getMessageById,
  deleteBatch,
  sendEmail,
  wait,
  processEmailDeletePayload,
} = require("./utlils");
require("dotenv").config();

const gmailBaseApiUrl = process.env.GMAIL_BASRE_API_URL;
const mongoUri = process.env.MONGO_URI;
const rabbitMqUri = process.env.RABBITMQ_URI;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const axiosInstance = axios.create({
  baseURL: gmailBaseApiUrl,
});

console.log(rabbitMqUri);

async function do_consume() {
  await wait(3000);
  var conn = await amqplib.connect(rabbitMqUri, "heartbeat=60");
  var ch = await conn.createChannel();
  var q = "email-delete";
  console.log("listening to queue");
  await conn.createChannel();
  await ch.assertQueue(q);
  await ch.consume(
    q,
    async function (msg) {
      await ch.ack(msg);
      await processMessage(msg);
      console.log("ack msg");
    },
    { consumerTag: "myconsumer" },
  );
}

do_consume();

async function processMessage(msg) {
  console.log(JSON.parse(msg.content));
  await handleEmailDelete(JSON.parse(msg.content));
}

async function handleEmailDelete(emailPayload) {
  console.log(emailPayload);
  const deleteDocsFlag = emailPayload.deleteDocs || false;
  let count = 0;
  try {
    let user = await User.findOne({ userId: emailPayload.userId });
    console.log(user._doc);
    user = user._doc;

    const emailList = user.emailList;
    let pageToken = user.lastPageToken;
    axiosInstance.defaults.headers.common["Authorization"] =
      `Bearer ${emailPayload.token}`;
    let emailIds = [];
    let first = true;

    while (emailIds.length > 59 || first) {
      count++;
      first = false;
      emailIds.length = 0;
      // let emailFetch = await getMails(axiosInstance, emailPayload.userId, pageToken)
      let emailFetch = await axiosInstance.get(
        `gmail/v1/users/${emailPayload.userId}/messages`,
        { params: { maxResults: 60, pageToken } },
      );

      pageToken = emailFetch.data.nextPageToken;
      emailIds.push(...emailFetch.data.messages.map((message) => message.id));
      const batchEmailIds = createBatch(emailIds, 10);

      for (let messages of batchEmailIds) {
        const gatherResponses = [];
        const emailsIdsToDelete = [];
        // let settledFlag = true;
        const messageResp = getMessageById(
          messages,
          emailPayload.userId,
          axiosInstance,
        );
        gatherResponses.push(...(await Promise.allSettled(messageResp)));

        await wait(1000);
        console.log("waiting");

        if (emailList.length > 1) {
          gatherResponses.map((emailResponse) => {
            processEmailDeletePayload(
              emailResponse,
              emailList,
              emailsIdsToDelete,
            );
          });
          console.log(
            "emailsIdsToDelete.length",
            emailsIdsToDelete.length,
            pageToken,
          );
          if (emailsIdsToDelete.length != 0) {
            await deleteBatch(
              emailsIdsToDelete,
              emailPayload.userId,
              axiosInstance,
            );
            user = await User.findOne({ userId: emailPayload.userId });
            await User.findByIdAndUpdate(user._id, {
              totalDeleted: user.totalDeleted + emailsIdsToDelete.length,
              lastPageToken: pageToken,
            });
            console.log(user.totalDeleted + emailsIdsToDelete.length);
          }
          if (!pageToken) await sendEmail(user.email);
        } else {
          return;
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
}
