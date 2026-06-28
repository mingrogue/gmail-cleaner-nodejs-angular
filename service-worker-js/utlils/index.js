const User = require("../userModel");
const google = require("googleapis");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URL;

const oauth2Client = new google.google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  redirectUrl,
);

async function sendEmail(userEmail) {
  //send completion email
}

async function wait(time) {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  });
}

async function deleteBatch(deleteBatch, userId, axiosInstance) {
  console.log("deleted", deleteBatch.length);
  let resp;
  try {
    resp = await Promise.allSettled(
      deleteMessage(deleteBatch, userId, axiosInstance),
    );
    if (resp[0].status != "fulfilled") {
      await setNewAccessToken(userId, axiosInstance);
      await Promise.allSettled(
        deleteMessage(deleteBatch, userId, axiosInstance),
      );
    }
  } catch (err) {
    await setNewAccessToken(userId, axiosInstance);
    await Promise.allSettled(deleteMessage(deleteBatch, userId, axiosInstance));
  }
}

function deleteMessage(batch, userId, axiosInstance) {
  return batch.map((messages) => {
    return axiosInstance.post(`gmail/v1/users/${userId}/messages/batchDelete`, {
      ids: messages,
    });
  });
}

function createBatch(data, batchSize) {
  let i = 0;
  const batch = [];
  while (i < data.length) {
    batch.push(data.slice(i, i + batchSize));
    i += batchSize;
  }
  return batch;
}

const makeRequest = async (axiosInstance, method, url, params, userId) => {
  try {
    return await axiosInstance[method](url, { params });
  } catch (err) {
    await setNewAccessToken(userId, axiosInstance);
    return await axiosInstance[method](url, { params });
  }
};

function getMessageById(messages, userId, axiosInstance) {
  return messages.map((messageId) => {
    return makeRequest(
      axiosInstance,
      "get",
      `gmail/v1/users/${userId}/messages/${messageId}`,
      {},
      userId,
    );
  });
}

async function setNewAccessToken(userId, axiosInstance) {
  const user = await User.findOne({ userId });
  oauth2Client.setCredentials({
    refresh_token: user.refreshToken,
  });
  const newAccessToken = await oauth2Client.getAccessToken();

  axiosInstance.defaults.headers.common["Authorization"] =
    `Bearer ${newAccessToken.res.data.access_token}`;
  return;
}

function checkForAttachments(email) {
  const foundAttachment = email.value.data.payload.parts.find(
    (emailPart) => emailPart.filename.length > 0,
  );
  if (foundAttachment) return true;
  else return false;
}

function processEmailDeletePayload(
  email,
  emailList,
  emailsIdsToDelete,
  keepAttachments = true,
  onlyKeepEmailsWithAttachments = false,
) {
  const senderEmailHost = email.value.data.payload.headers
    .filter((header) => header.name == "From")[0]
    ["value"].toLowerCase();
  if (keepAttachments && !onlyKeepEmailsWithAttachments) {
    const hasAttachment = checkForAttachments(email);

    !hasAttachment
      ? emailList.map((unwantedDomain) => {
          senderEmailHost.includes(unwantedDomain)
            ? emailsIdsToDelete.push(email.value.data.id)
            : null;
        })
      : null;
  } else if (onlyKeepEmailsWithAttachments) {
    !checkForAttachments(email)
      ? emailsIdsToDelete.push(email.value.data.id)
      : null;
  }
}

module.exports = {
  sendEmail,
  wait,
  deleteBatch,
  deleteMessage,
  createBatch,
  getMessageById,
  setNewAccessToken,
  makeRequest,
  checkForAttachments,
  processEmailDeletePayload,
};
