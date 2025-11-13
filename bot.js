// bot.js — 5 bots auto /register -> /login -> /server ffa
// Tự reconnect nếu bị kick / disconnect (ở mãi không rời khỏi)

const mineflayer = require('mineflayer')

// ================== CONFIG ==================
const SERVER_HOST = process.env.SERVER_HOST || 'basic.asaka.asia'
const SERVER_PORT = Number(process.env.SERVER_PORT || 25172)
const AUTH_MODE   = process.env.AUTH_MODE || 'offline'
// Nếu cần version cụ thể, thêm: version: '1.20.4'

const PASSWORD         = '11qqaa22wwss'
const TARGET_SUBSERVER = 'ffa'

const BOT_NAMES = [
  'xPvP',
  'Dreamzc',
  'Jacao',
  'ToiChapBet',
  'MeMayJa'
]

const JOIN_DELAY_MS = 2500
const RECONNECT_DELAY_MS = 5000
// ===========================================

function createBot (name) {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: name,
    auth: AUTH_MODE
  })

  // Trạng thái cho từng bot
  let registered = false
  let loggedIn   = false
  let joinedFFA  = false
  let reconnecting = false

  function scheduleReconnect(reason) {
    if (reconnecting) return
    reconnecting = true
    console.log(`[${name}] Disconnected (${reason}). Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`)
    setTimeout(() => {
      createBot(name)
    }, RECONNECT_DELAY_MS)
  }

  bot.once('spawn', () => {
    console.log(`[${name}] Spawned vào hub / lobby`)

    // Force lệnh cho chắc ăn, phòng khi server không gửi chat hướng dẫn
    setTimeout(() => {
      if (!registered) {
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`)
        console.log(`[${name}] (force) /register`)
      }
    }, 2000)

    setTimeout(() => {
      if (!loggedIn) {
        bot.chat(`/login ${PASSWORD}`)
        console.log(`[${name}] (force) /login`)
      }
    }, 5000)

    setTimeout(() => {
      if (!joinedFFA) {
        bot.chat(`/server ${TARGET_SUBSERVER}`)
        console.log(`[${name}] (force) /server ${TARGET_SUBSERVER}`)
      }
    }, 9000)
  })

  // BẮT CHAT SERVER
  bot.on('message', (jsonMsg) => {
    const msg = jsonMsg.toString().toLowerCase()
    // console.log(`[${name}] <SERVER> ${msg}`)

    // Các text tuỳ plugin login của sv bạn, cần thì chỉnh lại contains(...)
    if (!registered && msg.includes('/register')) {
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`)
      registered = true
      console.log(`[${name}] auto /register từ chat`)
    }

    if (!loggedIn && msg.includes('/login')) {
      bot.chat(`/login ${PASSWORD}`)
      loggedIn = true
      console.log(`[${name}] auto /login từ chat`)
    }

    // Khi đã login, thấy ffa → /server ffa
    if (!joinedFFA && loggedIn && msg.includes('ffa')) {
      bot.chat(`/server ${TARGET_SUBSERVER}`)
      joinedFFA = true
      console.log(`[${name}] auto /server ${TARGET_SUBSERVER} từ chat`)
    }
  })

  // Nếu bị kick, log + reconnect
  bot.on('kicked', (reason) => {
    console.log(`[${name}] Kicked:`, reason)
    scheduleReconnect('kicked')
  })

  // Nếu mất kết nối (server down / timeout / vv.) cũng reconnect
  bot.on('end', () => {
    scheduleReconnect('end')
  })

  bot.on('error', (err) => {
    console.log(`[${name}] Error:`, err)
  })

  return bot
}

// Tạo 5 bot lần lượt, cách nhau 2.5s
;(async () => {
  for (let i = 0; i < BOT_NAMES.length; i++) {
    const name = BOT_NAMES[i]
    console.log(`Đang tạo bot: ${name}`)
    createBot(name)
    await new Promise(res => setTimeout(res, JOIN_DELAY_MS))
  }
})()
