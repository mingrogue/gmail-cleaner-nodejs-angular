const amqp = require('amqplib');

// It falls back to localhost only if running outside of Docker
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:securepassword123@localhost:5672';

async function connectRabbit() {
    try {
        const connection = await amqp.connect(rabbitUrl);
        console.log("🚀 Successfully connected to RabbitMQ!");
    } catch (error) {
        console.error("❌ RabbitMQ Connection failed: ", error.message);
    }
}
connectRabbit();