import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ThankYou from './pages/ThankYou.jsx'
import NotFound from './pages/NotFound.jsx'

// Payment.jsx (/payment) is intentionally excluded from routing — the
// funnel currently sends users to the free Telegram channel instead of
// direct payment. The page and backend order/webhook flow stay in the
// codebase for when paid-channel sales resume.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
