const amqp = require('amqplib');

let ch = null;
let conn = null;
const rabbitUri = process.env.RABBITMQ_URI || 'amqp://admin:securepassword123@localhost:5672';

exports.publishMessage = async function(queue, message) {
  try {
    if (!conn) {
      conn = await amqp.connect(rabbitUri);
    }
    if (!ch) {
      ch = await conn.createChannel();
    }
    await ch.assertQueue(queue, { durable: true });
    await ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log("Sent '%s'", JSON.stringify(message));
  } catch (err) {
    console.error('Error publishing message:', err);
    throw err;
  }
};

process.on('exit', () => {
  if (ch) ch.close();
  if (conn) conn.close();
  console.log('Closing rabbitmq connection');
});