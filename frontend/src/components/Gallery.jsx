import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import MediaModal from './MediaModal.jsx'

// Drop new photos/videos into src/assets/media/ — this glob picks them up
// automatically on the next dev reload or build, no code change needed.
const photoModules = import.meta.glob('../assets/media/*.{jpg,jpeg,JPG,JPEG,png,PNG,webp,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const videoModules = import.meta.glob('../assets/media/*.{mp4,MP4,mov,MOV}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function toItems(modules, type) {
  return Object.keys(modules)
    .sort()
    .map((path) => ({ type, src: modules[path] }))
}

const MEDIA_ITEMS = [...toItems(videoModules, 'video'), ...toItems(photoModules, 'image')]

export default function Gallery() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 4000, stopOnMouseEnter: true, stopOnInteraction: false }),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState([])
  const [modalItem, setModalItem] = useState(null)
  const videoRefs = useRef({})

  const syncPlayback = useCallback((api) => {
    setSelectedIndex(api.selectedIndex)
    const inView = new Set(api.slidesInView())
    Object.entries(videoRefs.current).forEach(([i, el]) => {
      if (!el) return
      if (inView.has(Number(i))) el.play().catch(() => {})
      else el.pause()
    })
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    syncPlayback(emblaApi)
    emblaApi.on('select', syncPlayback)
    emblaApi.on('slidesInView', syncPlayback)
    emblaApi.on('reInit', syncPlayback)
    return () => {
      emblaApi.off('select', syncPlayback)
      emblaApi.off('slidesInView', syncPlayback)
      emblaApi.off('reInit', syncPlayback)
    }
  }, [emblaApi, syncPlayback])

  if (!MEDIA_ITEMS.length) return null

  const openModal = (item) => {
    Object.values(videoRefs.current).forEach((el) => el?.pause())
    setModalItem(item)
  }

  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-accent-light font-semibold">Наши работы</span>
          <h2 className="text-3xl sm:text-4xl mt-3 text-gradient-chrome">Клиенты и авто</h2>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -mx-2">
              {MEDIA_ITEMS.map((item, i) => (
                <div key={item.src} className="shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 px-2">
                  <button
                    type="button"
                    onClick={() => openModal(item)}
                    aria-label={item.type === 'image' ? 'Открыть фото' : 'Открыть видео'}
                    className="group relative block w-full aspect-[4/5] rounded-xl overflow-hidden card-surface"
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.src}
                        alt="BAZA Import — клиент и автомобиль"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <video
                        ref={(el) => {
                          videoRefs.current[i] = el
                        }}
                        src={item.src}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {item.type === 'video' && (
                      <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-bg/80 border border-border flex items-center justify-center text-chrome">
                        &#9654;
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Предыдущий слайд"
            className="hidden sm:flex absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 rounded-full border border-border bg-bg/90 items-center justify-center text-chrome hover:border-accent/50 transition-colors"
          >
            &#8592;
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Следующий слайд"
            className="hidden sm:flex absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 rounded-full border border-border bg-bg/90 items-center justify-center text-chrome hover:border-accent/50 transition-colors"
          >
            &#8594;
          </button>
        </div>

        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Слайд ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? 'bg-accent-light' : 'bg-border'}`}
              />
            ))}
          </div>
        )}
      </div>

      {modalItem && <MediaModal item={modalItem} onClose={() => setModalItem(null)} />}
    </section>
  )
}
