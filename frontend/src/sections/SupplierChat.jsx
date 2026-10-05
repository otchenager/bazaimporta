import { useState } from 'react'
import Lightbox from '../components/Lightbox.jsx'
import Todo from '../components/Todo.jsx'
import { todo } from '../content/copy.js'

// src/assets/chat: <img>-720.webp / -1080.webp и <img>.json с размерами — готовит scripts/prepare-case-media.py
const files = import.meta.glob('../assets/chat/*.webp', { eager: true, query: '?url', import: 'default' })
const sizes = import.meta.glob('../assets/chat/*.json', { eager: true, import: 'default' })
const url = (img, w) => files[`../assets/chat/${img}-${w}.webp`]

/** Скриншот переписки в рамке «телефона» под шагами трека; по клику — крупно в лайтбоксе. Нет файла — нет карточки. */
export default function SupplierChat({ chat }) {
  const [open, setOpen] = useState(null)
  const size = sizes[`../assets/chat/${chat.img}.json`]
  if (!size || !url(chat.img, 720)) return <Todo value={todo('скриншот переписки: incoming/est-opyt/supplier-chat.png → python scripts/prepare-case-media.py')} as="p" className="mt-8" />
  const large = url(chat.img, 1080)
  return (
    <figure className="mt-10 w-full sm:max-w-[340px]">
      <button type="button" className="chat-phone" onClick={() => setOpen(0)} aria-label={`Открыть крупно: ${chat.alt}`}>
        <img
          src={url(chat.img, 720)}
          srcSet={`${url(chat.img, 720)} ${size.width}w, ${large} ${size.large}w`}
          sizes="(max-width: 640px) 92vw, 340px"
          width={size.width}
          height={size.height}
          alt={chat.alt}
          loading="lazy"
          decoding="async"
        />
      </button>
      <figcaption className="mt-3 text-sm text-muted">{chat.caption}</figcaption>
      <Lightbox items={[{ src: large, alt: chat.alt, width: size.width, height: size.height }]} index={open} onChange={setOpen} label={chat.caption} />
    </figure>
  )
}
