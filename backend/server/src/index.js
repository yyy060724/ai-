import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { initDb } from './db.js'
import { createSparkStream } from './sparkClient.js'
import { loadChatState, saveChatState } from './stateRepository.js'

const app = express()
const PORT = Number(process.env.SERVER_PORT ?? 3000)

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', async (_req, res) => {
  res.json({
    ok: true,
    service: 'ai-chat-assistant-server',
    time: new Date().toISOString(),
  })
})

app.get('/api/state', async (_req, res) => {
  try {
    const state = await loadChatState()
    res.json({ state })
  } catch (error) {
    console.error('Failed to load state:', error)
    res.status(500).json({ message: 'Failed to load persisted chat state.' })
  }
})

app.put('/api/state', async (req, res) => {
  try {
    const state = req.body

    if (!state || !Array.isArray(state.conversations)) {
      return res.status(400).json({ message: 'Invalid state payload.' })
    }

    await saveChatState(state)
    return res.json({ ok: true })
  } catch (error) {
    console.error('Failed to save state:', error)
    return res.status(500).json({ message: 'Failed to save chat state.' })
  }
})

app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body ?? {}

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ message: 'messages must be a non-empty array.' })
    }

    try {
      const upstream = await createSparkStream({ messages, model, temperature, max_tokens })

      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders?.()

      if (upstream.data) {
        upstream.data.on('data', (chunk) => {
          res.write(chunk)
        })

        upstream.data.on('end', () => {
          res.end()
        })

        upstream.data.on('error', (error) => {
          console.error('Stream error:', error)
          res.end()
        })
      } else {
        console.error('No data stream received from upstream')
        res.status(500).json({ message: 'No data stream received from upstream' })
      }
    } catch (error) {
      console.error('Error in stream processing:', error)
      res.status(500).json({ message: error.message || 'Internal server error' })
    }
  } catch (error) {
    console.error('Stream proxy failed:', error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Unexpected stream proxy error.',
    })
  }
})

const bootstrap = async () => {
  try {
    await initDb()
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to bootstrap server:', error)
    process.exit(1)
  }
}

bootstrap()
