import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center gap-8">
      <Logo />
      <div>
        <h1 className="text-3xl normal-case text-gradient-chrome mb-3">Страница не найдена</h1>
        <p className="normal-case text-text-muted font-sans">Такой страницы не существует.</p>
      </div>
      <Link
        to="/"
        className="btn-accent text-white font-display uppercase tracking-wide px-8 py-3 rounded-lg transition-all"
      >
        На главную
      </Link>
    </div>
  )
}
