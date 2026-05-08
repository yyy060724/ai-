import axios from 'axios'
import http from 'node:http'
import https from 'node:https'

const SPARK_BASE_URL = (process.env.SPARK_BASE_URL ?? 'https://spark-api-open.xf-yun.com/x2').replace(/\/+$/, '')
const SPARK_MODEL = process.env.SPARK_MODEL ?? 'spark-x'
const SPARK_API_PASSWORD = (process.env.SPARK_API_PASSWORD ?? '').trim()

// 创建axios实例，添加网络配置
const axiosInstance = axios.create({
  timeout: 30000,
  httpAgent: new http.Agent({
    keepAlive: true,
    family: 4 // 强制使用IPv4，避免IPv6解析问题
  }),
  httpsAgent: new https.Agent({
    keepAlive: true,
    family: 4 // 强制使用IPv4，避免IPv6解析问题
  })
})

export const createSparkStream = async ({
  messages,
  model = SPARK_MODEL,
  temperature = 0.7,
  max_tokens = 2000,
}) => {
  if (!SPARK_API_PASSWORD) {
    throw new Error('Missing SPARK_API_PASSWORD in server environment.')
  }

  try {
    console.log('Attempting to connect to:', SPARK_BASE_URL)
    const response = await axiosInstance.post(`${SPARK_BASE_URL}/chat/completions`, {
      model,
      messages,
      stream: true,
      temperature,
      max_tokens,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SPARK_API_PASSWORD}`,
      },
      responseType: 'stream'
    })

    return response
  } catch (error) {
    console.error('Error connecting to Spark API:', error)
    if (error.code === 'ENOTFOUND') {
      throw new Error('无法解析讯飞星火API域名，请检查网络连接和DNS配置')
    }
    throw error
  }
}
