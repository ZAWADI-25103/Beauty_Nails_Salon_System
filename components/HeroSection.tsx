import { useEffect, useRef, useState } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Badge } from './ui/badge'
import { Award, CalendarIcon, MessageCircle, Sparkles, Workflow, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'
import Image from 'next/image'

// Lightweight carousel type that matches the minimal shape used on the landing page.
// Keeps `HeroSection` decoupled from the full backend `Service` type.
export type CarouselService = {
  id: string
  name: string
  description?: string
  icon?: string
  image?: string
  imageUrl?: string
  color?: string
}

interface HeroSectionProps {
  imageUrl: string
  badgeText?: string
  title: string
  subtitle?: string
  description: string
  isLogoNeeded?: boolean
  areLinksNeeded?: boolean
  links?: Array<{
    href: string
    label: string
  }>
  // Optional carousel props
  services?: CarouselService[]
  showCarousel?: boolean
  autoPlayInterval?: number
  isLoading?: boolean
  onServiceChange?: (service: CarouselService) => void
}

function HeroSection({
  imageUrl,
  badgeText,
  title,
  subtitle,
  description,
  isLogoNeeded,
  areLinksNeeded,
  links,
  services,
  showCarousel = false,
  autoPlayInterval = 5000,
  isLoading = false,
  onServiceChange,
}: HeroSectionProps) {

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<number | null>(null)

  // Auto-play (depend on length to reduce unnecessary re-runs)
  useEffect(() => {
    if (!showCarousel || !services || services.length <= 1) return
    if (isPaused) return

    intervalRef.current = window.setInterval(() => {
      setCurrentIndex((i) => (i + 1) % services.length)
    }, autoPlayInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPaused, services?.length, showCarousel, autoPlayInterval])

  // Notify parent when service changes (guard to avoid redundant calls that can cause loops)
  const lastEmittedServiceId = useRef<string | null>(null)
  useEffect(() => {
    if (!services || services.length === 0 || !onServiceChange) return
    const svc = services[currentIndex]
    if (!svc) return
    if (lastEmittedServiceId.current === svc.id) return
    lastEmittedServiceId.current = svc.id
    onServiceChange(svc)
  }, [currentIndex, services, onServiceChange])

  // Badge selection logic (unchanged)
  let custom_badge = null
  switch (badgeText) {
    case "nos services":
      custom_badge = (
        <Badge className="mb-6 bg-pink-500/20 text-pink-100 border-pink-300/30 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 mr-2" />
          {badgeText}
        </Badge>
      )
      break;
    case "nos abonnements":
      custom_badge = (
        <Badge className="mb-6 bg-pink-500/20 text-pink-100 border-pink-300/30 backdrop-blur-sm">
          <Award className="w-4 h-4 mr-2" />
          {badgeText}
        </Badge>
      )
      break;
    case "reservation":
      custom_badge = (
        <Badge className="mb-6 bg-pink-500/20 text-pink-100 border-pink-300/30 backdrop-blur-sm">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {badgeText}
        </Badge>
      )
      break;

    case "nos contacts":
      custom_badge = (
        <Badge className="mb-6 bg-pink-500/20 text-pink-100 border-pink-300/30 backdrop-blur-sm">
          <MessageCircle className="w-4 h-4 mr-2" />
          {badgeText}
        </Badge>
      )
      break;

    case "notre histoire":
      custom_badge = (
        <Badge className="mb-6 bg-pink-500/20 text-pink-100 border-pink-300/30 backdrop-blur-sm">
          <Workflow className="w-4 h-4 mr-2" />
          {badgeText}
        </Badge>
      )
      break;

    default:
      break;
  }

  const currentService = services && services.length > 0 ? services[currentIndex] : null
  const imageSrc = currentService ? currentService.image || currentService.imageUrl || imageUrl : imageUrl

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-155 md:h-180 flex items-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <ImageWithFallback
          src={imageSrc}
          alt={currentService ? currentService.name : 'Beauty Nails Salon'}
          className="w-full h-full object-cover"
        />
        {/* Subtle gradient overlay + mild blur so the text remains legible */}
        <div className="absolute inset-0 bg-linear-to-r from-black/30 via-black/15 to-transparent mix-blend-overlay backdrop-blur-xs" />
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-2xl bg-black/20 backdrop-blur-sm p-6 rounded-xl">
          {/* Logo / Badge / Carousel header */}
          {showCarousel && currentService ? (
            <div className="mb-6">
              <Badge className="mb-4 bg-pink-500/20 text-pink-100 border-pink-300/30 backdrop-blur-sm">
                {currentService?.icon} {currentService?.name}
              </Badge>
            </div>
          ) : isLogoNeeded ? (
            <Image
              src={'/Bnails_ white.png'}
              alt="Beauty Nails Logo"
              width={420}
              height={90}
              className={`transition-all duration-300`}
              priority
            />
          ) : (
            custom_badge
          )}

          <h1 className="text-5xl lg:text-6xl text-white mb-6 leading-tight font-serif drop-shadow-2xl">
            {title}<br />
            <span className="text-amber-200">
              {subtitle}
            </span>
          </h1>

          {showCarousel && currentService ? (
            <p className="text-xl text-pink-100 mb-6">{currentService.description}</p>
          ) : (
            <p className="text-xl text-pink-100 mb-8">{description}</p>
          )}

          {areLinksNeeded && (
            <div className="flex flex-col sm:flex-row gap-4">
              {links?.map((link: any, index: any) => (
                <Link key={index} href={link.href}>
                  <Button className='bg-linear-to-br from-gray-900 via-pink-800 to-pink-600 hover:from-pink-600 hover:via-pink-800 hover:to-gray-900 text-white rounded-2xl' size={'lg'}>
                    {link.label}
                  </Button>
                </Link>

              ))}
            </div>
          )}

          {/* Carousel indicators and manual controls */}
          {showCarousel && services && services.length > 1 && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                {services.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-3 h-3 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex((i) => (i - 1 + (services?.length ?? 1)) % (services?.length ?? 1))}
                  className="text-white/80 hover:text-white"
                  aria-label="Previous slide"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentIndex((i) => (i + 1) % (services?.length ?? 1))}
                  className="text-white/80 hover:text-white"
                  aria-label="Next slide"
                >
                  ›
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}

export default HeroSection