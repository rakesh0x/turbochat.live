import { Worker, Job } from "bullmq";
import IORedis from 'ioredis'
import { POST } from "./route";

const connection = new IORedis(process.env.REDIS_URL!);
const backend_url = process.env.BACKEND_URL

export async function CreateChatbothandlertobackend() {
    const worker = new Worker('delegateChatbot', async(job) => {
        const { name, website, limit, userId } = job.data

            const response = await fetch(`${backend_url}/api/chatbot`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userId}`
            },
            body: JSON.stringify({ name, website, limit})
        })

        worker.on("completed", (job) => {
            console.log(`${job.id} is completed`)
        })

        worker.on("failed", (job, err) => {
            console.error(`${job.id} failed with ${err.message}`)
        })
    })
}