import { getDbPool } from './db.js'

const CHAT_STATE_KEY = 'chat_state'

export const loadChatState = async () => {
  const db = getDbPool()
  const [rows] = await db.query(
    'SELECT state_json FROM app_state WHERE state_key = :stateKey LIMIT 1',
    { stateKey: CHAT_STATE_KEY },
  )

  if (!rows.length) {
    return null
  }

  const raw = rows[0].state_json

  if (typeof raw === 'string') {
    return JSON.parse(raw)
  }

  return raw
}

export const saveChatState = async (state) => {
  const db = getDbPool()

  await db.query(
    `
    INSERT INTO app_state (state_key, state_json)
    VALUES (:stateKey, CAST(:stateJson AS JSON))
    ON DUPLICATE KEY UPDATE state_json = CAST(:stateJson AS JSON);
    `,
    {
      stateKey: CHAT_STATE_KEY,
      stateJson: JSON.stringify(state),
    },
  )
}
