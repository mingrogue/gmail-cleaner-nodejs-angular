const amqp = require('amqplib/callback_api');

let ch = null;
const rabbitUri = process.env.RABBITMQ_URI;

exports.publishMessage = function(queue, message){
	amqp.connect('amqp://user:bitnami@localhost:5671', function (err, conn) {
		if(err){
			throw err;
		}
		conn.createChannel(function (err, channel) {
			ch = channel;
			publishToQueue(queue, JSON.stringify(message));
		});
	});
};

const publishToQueue = async (queue, data) => {
   	ch.assertQueue(queue, {
      durable: true
    });
    await ch.sendToQueue(queue, Buffer.from(data), {persistent: true});
    console.log("Sent '%s'", data);
}

process.on('exit', (code) => {
   ch.close();
   console.log(`Closing rabbitmq channel`);
});