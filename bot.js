// bot.js — 5 bot auto /register -> /login -> /server ffa
// Mỗi lần connect/reconnect đều /register & /login lại cho chắc

const mineflayer = require('mineflayer')

// ================== CONFIG ==================
const SERVER_HOST = 'basic.asaka.asia' // host server Java
const SERVER_PORT = 25172                     // port Java
const AUTH_MODE   = 'offline'                 // offline / microsoft

const PASSWORD         = '11qqaa22wwss'
const TARGET_SUBSERVER = 'ffa'

const BOT_NAMES = [
  'xPvP',
  'Dreamzc',
  'Jacao',
  'ToiChapBet',
  'MeMayJa'
]

const JOIN_DELAY_MS       = 8000   // 8s giữa mỗi bot join
const BASE_RECONNECT_MS   = 30000  // 30s
const TOO_FAST_RECONNECT  = 60000  // 60s nếu bị "too fast"
const MC_VERSION          = '1.20.4' // chỉnh đúng version Java sv
// ===========================================

function startBotForever (name) {
  function connect () {
    console.log(`[${name}] Đang kết nối tới ${SERVER_HOST}:${SERVER_PORT}...`)

    const bot = mineflayer.createBot({
      host: SERVER_HOST,
      port: SERVER_PORT,
      username: name,
      auth: AUTH_MODE,
      version: MC_VERSION
    })

    let joinedFFA = false

    function scheduleReconnect (reason) {
      let reasonStr
      try {
        reasonStr = typeof reason === 'string' ? reason : JSON.stringify(reason)
      } catch {
        reasonStr = String(reason)
      }

      const lower = reasonStr.toLowerCase()
      let delay = BASE_RECONNECT_MS

      if (lower.includes('too fast')) {
        delay = TOO_FAST_RECONNECT
      }

      delay += Math.floor(Math.random() * 10000) // + random 0–10s

      console.log(
        `[${name}] Sẽ reconnect trong ${Math.round(delay / 1000)}s (reason: ${reasonStr})`
      )
      setTimeout(connect, delay)
    }

    bot.once('spawn', () => {
      console.log(`[${name}] Đã vào server (spawn)`)

      // 1) LUÔN /register lại
      setTimeout(() => {
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`)
        console.log(`[${name}] /register ${PASSWORD} ${PASSWORD}`)
      }, 2000)

      // 2) LUÔN /login lại
      setTimeout(() => {
        bot.chat(`/login ${PASSWORD}`)
        console.log(`[${name}] /login ${PASSWORD}`)
      }, 5000)

      // 3) Sau đó vào /server ffa
      setTimeout(() => {
        bot.chat(`/server ${TARGET_SUBSERVER}`)
        joinedFFA = true
        console.log(`[${name}] /server ${TARGET_SUBSERVER}`)
      }, 9000)
    })

    // Bắt message chỉ để hỗ trợ vụ FFA (không đụng tới /register, /login nữa)
    bot.on('message', (jsonMsg) => {
      const msg = jsonMsg.toString().toLowerCase()
      // console.log(`[${name}] <SV> ${msg}`)

      if (!joinedFFA && msg.includes('ffa')) {
        bot.chat(`/server ${TARGET_SUBSERVER}`)
        joinedFFA = true
        console.log(`[${name}] auto /server ${TARGET_SUBSERVER} từ chat`)
      }
    })

    bot.on('kicked', (reason) => {
      console.log(`[${name}] Kicked:`, reason)
      scheduleReconnect(reason)
    })

    bot.on('end', () => {
      console.log(`[${name}] Kết nối kết thúc (end).`)
      scheduleReconnect('end')
    })

    bot.on('error', (err) => {
      console.log(`[${name}] Error:`, err)
    })
  }

  connect()
}

// Tạo 5 bot lần lượt
;(async () => {
  for (const name of BOT_NAMES) {
    console.log(`Đang tạo bot: ${name}`)
    startBotForever(name)
    await new Promise(res => setTimeout(res, JOIN_DELAY_MS))
  }
})()
