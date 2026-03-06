async function fetchUniqueEmails(emailIds, userId) {
  emailIds = emailIds.map(email => email.id)
  const uniqueEmails = new Set()
  const batch = this.createBatch(emailIds)
  const gatherResponses = []
  for(let messages of batch){
    gatherResponses.push(...await Promise.allSettled(getMessageById(messages, userId)))
  }
  gatherResponses.map(response => {
    uniqueEmails.add(response.value.data.payload.headers.filter(header => header.name == 'From')[0]['value'])
  })
  return uniqueEmails
}

async function getMessageById(messages, userId){
  return messages.map(messageId => {
    return this.axiosInstance.get(`gmail/v1/users/${userId}/messages/${messageId}`)
  })
}

async function createBatch(data) {
  let i = 0;
  const batch = [];
  while (i < data.length) {
    batch.push(data.slice(i, i + 10));
    i += 10;
  }
  return batch;
}

module.exports = {
  fetchUniqueEmails
}