import 'dotenv/config'
import { createApp } from './app.js'

const PORT = process.env.PORT || 4000
createApp(process.env).listen(PORT, () => {
  console.log(`BAZA Import backend listening on port ${PORT}`)
})
