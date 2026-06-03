import IORedis from 'ioredis'
import { Queue, Worker } from 'bullmq'
import { NextRequest, NextResponse } from 'next/server'

const connection = new IORedis(process.env.REDIS_URL!)
const queue = new Queue('myqueue', { connection })

export async function POST(request: NextRequest) {
    const response = await request.json()

    const job = await queue.add('create-chatbot', {
        name: response.name,
        website: response.website,
        limit: response.limit,
        userId: response.userId
    })
    return NextResponse.json({ jobID: job.id });
}

async function getJobfulfilled(jobId: string) {
    const checkJobid = await queue.getJob(jobId);

    if(!jobId) {
        return false;
    }

    const state = await checkJobid?.getState();
    return state === 'completed'
}