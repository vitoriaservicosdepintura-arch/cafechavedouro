import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { supabase } from './supabase';
import Admin from './Admin';
import {
  Settings as SettingsIcon,
  X, Calendar, Clock, Users, Phone, Loader2, CheckCircle2
} from 'lucide-react';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from 'framer-motion';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */



const getTextStyle = (color: string) => {
  if (!color) return {};
  if (color.includes('gradient')) {
    return {
      background: color,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block'
    };
  }
  return { color };
};

/* ═══════════════════════════════════════════
   DEFAULT CONFIG
   ═══════════════════════════════════════════ */

const DEFAULT_CONFIG = {
  logo: '🔥',
  logoIsImage: false,
  hero: {
    title: 'Churrasqueira Amores',
    badge: 'Desde 2009 • Odiáxere, Algarve',
    subtitle: 'O autêntico sabor do frango na brasa. Uma joia escondida no coração do Algarve, onde a tradição e o sabor se encontram.',
    bgImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=1080&fit=crop&q=80',
    ctaText: 'Reservar Mesa'
  },
  about: {
    badge: 'A Nossa História',
    title: 'Tradição e Sabor',
    subtitle: 'Desde Sempre',
    text1: 'Na Churrasqueira Amores, cada frango é uma obra de arte. Marinado com temperos tradicionais portugueses e assado lentamente sobre carvão, o nosso frango tem conquistado corações há mais de 15 anos.',
    text2: 'Localizada na pacata vila de Odiáxere, no coração do Algarve, somos um restaurante familiar onde a simplicidade encontra a excelência. Os nossos clientes voltam sempre — pelo frango crocante, pelas batatas fritas caseiras e pelo ambiente acolhedor.',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&h=600&fit=crop&q=80'
  },
  menuItems: [
    {
      id: 1,
      name: 'Frango Churrasco',
      description: 'O nosso frango assado na brasa, marinado com temperos tradicionais portugueses. Pele crocante e carne suculenta.',
      price: '8,50€',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop&q=80',
      tag: '⭐ Especialidade',
      category: 'Pratos',
    },
    {
      id: 2,
      name: 'Batatas Fritas Caseiras',
      description: 'Cortadas à mão e fritas na hora. Simplesmente soberbas, como dizem os nossos clientes.',
      price: '3,50€',
      image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&h=400&fit=crop&q=80',
      tag: '❤️ Favorito',
      category: 'Acompanhamentos',
    },
    {
      id: 3,
      name: 'Salada Especial da Casa',
      description: 'Salada fresca com o nosso molho fabuloso que tem conquistado todos os visitantes.',
      price: '4,00€',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&q=80',
      tag: '🥗 Saudável',
      category: 'Acompanhamentos',
    },
    {
      id: 4,
      name: 'Frango Piri-Piri',
      description: 'Para os amantes de picante. Grelhado com o nosso molho piri-piri artesanal e irresistível.',
      price: '9,50€',
      image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&h=400&fit=crop&q=80',
      tag: '🌶️ Picante',
      category: 'Pratos',
    },
    {
      id: 5,
      name: 'Espetada Mista',
      description: 'Espetada de carnes mistas grelhadas na perfeição sobre carvão ardente.',
      price: '12,00€',
      image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&q=80',
      tag: '🔥 Premium',
      category: 'Pratos',
    },
    {
      id: 6,
      name: 'Sangria da Casa',
      description: 'Sangria artesanal com frutas frescas da época e vinho tinto alentejano selecionado.',
      price: '6,00€',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=400&fit=crop&q=80',
      tag: '🍷 Bebida',
      category: 'Bebidas',
    },
  ],
  gallery: [
    { url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop&q=80', label: 'Os Nossos Pratos' },
    { url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop&q=80', label: 'Frango na Brasa' },
    { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80', label: 'O Restaurante' },
    { url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&q=80', label: 'Grelhados' },
    { url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&h=400&fit=crop&q=80', label: 'Batatas Artesanais' },
    { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop&q=80', label: 'Ambiente Acolhedor' },
  ],
  contact: {
    title: 'Venha Conhecer-nos',
    text: 'Estamos à sua espera para lhe oferecer o melhor frango do Algarve',
    address: '250, N125 n°66c\n8600-250 Odiáxere\nAlgarve, Portugal',
    googleMapsUrl: 'https://maps.google.com/?q=Churrasqueira+Amores+Odiaxere',
    hours: [
      { day: 'Segunda – Sábado', time: '12:00 – 22:00' },
      { day: 'Domingo', time: '12:00 – 21:00' }
    ],
    phone: '282 798 417',
    facebook: 'https://facebook.com',
    email: ''
  },
  footer: {
    info: [
      '📍 N125 n°66c, Odiáxere',
      '📞 282 798 417',
      '💰 10 – 15€ por pessoa',
      '⭐ 4.5 / 5 (329 avaliações)'
    ],
    services: [
      '🍽️ Comer no local',
      '🥡 Take away',
      '🛵 Entrega ao domicílio',
      '📞 Reservas por telefone'
    ]
  }
};

const REVIEWS = [
  {
    id: 1,
    name: 'jjc',
    avatar: 'J',
    text: 'Uma joia escondida do frango assado. A uma curta distância de carro das multidões de turistas, este restaurante familiar especializado em frango assado é um verdadeiro tesouro. O frango? Perfeito — pele crocante, carne suculenta e cheio de sabor.',
    rating: 5,
    date: 'há 7 meses',
    reviewCount: '11 críticas',
    color: '#f59e0b',
  },
  {
    id: 2,
    name: 'Herve Garand',
    avatar: 'H',
    text: 'Nós adoramos, esse pequeno restaurante nos foi recomendado, nos divertimos muito, é simples, é simpático e é super bom e por 30 euros para dois. Voltaremos com certeza!',
    rating: 5,
    date: 'há 5 meses',
    reviewCount: '186 críticas',
    color: '#831df6',
  },
  {
    id: 3,
    name: 'Victoria Hallam',
    avatar: 'V',
    text: 'Não sei como Odiáxere tem duas das melhores churrasqueiras do Algarve, mas tem. A única coisa melhor que o frango é a salada com o seu molho fabuloso.',
    rating: 5,
    date: 'há 10 meses',
    reviewCount: '52 críticas',
    color: '#f97316',
  },
  {
    id: 4,
    name: 'Marco Silva',
    avatar: 'M',
    text: 'Muito bons pratos de comida... graças ao dono/a da churrasqueira. Preços honestos e qualidade excepcional. O melhor frango assado que já comi!',
    rating: 5,
    date: 'há 3 meses',
    reviewCount: '8 críticas',
    color: '#ef4444',
  },
  {
    id: 5,
    name: 'Ana Costa',
    avatar: 'A',
    text: 'Muito bom, só é pena ter poucas mesas, mas tudo 5 estrelas. O frango é incrível e as batatas fritas caseiras são as melhores que já comi no Algarve.',
    rating: 4,
    date: 'há 2 meses',
    reviewCount: '24 críticas',
    color: '#b146fe',
  },
];

const STATS = [
  { value: 329, suffix: '+', label: 'Avaliações', decimal: false },
  { value: 4.5, suffix: '★', label: 'Classificação', decimal: true },
  { value: 15, suffix: '+', label: 'Anos de Tradição', decimal: false },
  { value: 10000, suffix: '+', label: 'Clientes Felizes', decimal: false },
];

const NAV_LINKS = [
  { label: 'Início', href: '#hero' },
  { label: 'Sobre', href: '#about' },
  { label: 'Menu', href: '#menu' },
  { label: 'Galeria', href: '#gallery' },
  { label: 'Críticas', href: '#reviews' },
  { label: 'Contato', href: '#contact' },
];

/* ═══════════════════════════════════════════
   UTILITY COMPONENTS
   ═══════════════════════════════════════════ */

function StarRating({ rating, size = 'w-5 h-5' }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${size} ${star <= rating ? 'text-gold' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function AnimatedCounter({ value, suffix = '', decimal = false }: { value: number; suffix?: string; decimal?: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(decimal ? Math.round(eased * value * 10) / 10 : Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, decimal]);

  return (
    <span ref={ref}>
      {decimal ? count.toFixed(1) : count.toLocaleString()}
      {suffix}
    </span>
  );
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function EmberParticles() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const embers = useMemo(
    () =>
      Array.from({ length: isMobile ? 12 : 35 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * (isMobile ? 3 : 4) + 1.5,
        duration: Math.random() * 8 + 5,
        delay: Math.random() * 6,
        color: ['#f59e0b', '#f97316', '#ef4444', '#fbbf24', '#fb923c'][Math.floor(Math.random() * 5)],
      })),
    [isMobile]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {embers.map((e) => (
        <div
          key={e.id}
          className="ember-particle"
          style={{
            left: `${e.left}%`,
            bottom: '-10px',
            width: `${e.size}px`,
            height: `${e.size}px`,
            backgroundColor: e.color,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            boxShadow: `0 0 ${e.size * 3}px ${e.color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════ */

function Navbar({ config, onOpenAdmin }: { config: any, onOpenAdmin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const siteTitleParts = config.hero?.title?.split(' ') || ['Churrasqueira', 'Amores'];
  const firstPart = siteTitleParts[0];
  const lastPart = siteTitleParts.slice(1).join(' ');

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-deep/90 backdrop-blur-2xl shadow-2xl shadow-black/30 border-b border-white/5' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.a href="#hero" className="flex items-center gap-3 group" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold via-flame to-ember flex items-center justify-center shadow-lg shadow-flame/30 group-hover:shadow-flame/50 transition-shadow duration-300 overflow-hidden">
              {config.logoIsImage ? (
                <img src={config.logo} alt={`Logótipo ${config.hero?.title}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl" aria-hidden="true">{config.logo || '🔥'}</span>
              )}
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold tracking-tight" style={getTextStyle(config.hero?.titleColor)}>{firstPart}</span>
              <span className="text-gold font-extrabold ml-1" style={!config.hero?.titleColor ? {} : getTextStyle(config.hero?.titleColor)}>{lastPart}</span>
            </div>
          </motion.a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-gold transition-colors duration-300 relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i + 0.4 }}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-gold to-flame rounded-full transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
            <motion.button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 transition-all cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              ADMIN
            </motion.button>
            <motion.button
              onClick={() => (window as any).openReservationModal()}
              className="ml-2 px-5 py-2.5 bg-gradient-to-r from-gold via-flame to-ember rounded-full text-sm font-bold text-white shadow-lg shadow-flame/25 hover:shadow-flame/50 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Reservar uma mesa"
            >
              📞 Reservar
            </motion.button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-3 -mr-2 text-white relative z-50 rounded-xl hover:bg-white/5 transition-colors" aria-label="Abrir menu de navegação">
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block w-full h-0.5 bg-white rounded transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[9px]' : ''}`} />
              <span className={`block w-full h-0.5 bg-white rounded transition-all duration-300 ${menuOpen ? 'opacity-0 scale-0' : ''}`} />
              <span className={`block w-full h-0.5 bg-white rounded transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-deep/98 backdrop-blur-2xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-8 space-y-5">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-lg font-semibold text-gray-200 hover:text-gold transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {link.label}
                </motion.a>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  (window as any).openReservationModal();
                }}
                className="block w-full text-center px-6 py-4 bg-gradient-to-r from-gold to-flame rounded-full text-base font-bold text-white shadow-lg mt-4 cursor-pointer active:scale-95 transition-transform"
                aria-label="Fazer uma reserva rápida"
              >
                📞 Reservar Agora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════ */

function Hero({ config }: { config: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);

  const titleParts = config.hero?.title?.split(' ') || ['Churrasqueira', 'Amores'];
  const firstPart = titleParts[0];
  const lastPart = titleParts.slice(1).join(' ');

  return (
    <section id="hero" ref={ref} className="relative h-screen min-h-[700px] overflow-hidden">
      {/* Parallax background */}
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: bgY, scale: bgScale }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.hero?.bgImage})` }}
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep/80 via-deep/30 to-deep" />
      <div className="absolute inset-0 bg-gradient-to-r from-deep/70 via-transparent to-deep/50" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-deep to-transparent" />

      {/* Ember particles */}
      <EmberParticles />

      {/* Glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-flame/8 rounded-full blur-[120px] glow-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-ember/8 rounded-full blur-[100px] glow-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-royal/6 rounded-full blur-[80px] glow-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content */}
      <motion.div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4" style={{ opacity: contentOpacity, y: contentY }}>
        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.7, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-8">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold/10 border border-gold/25 rounded-full text-gold text-sm font-semibold backdrop-blur-sm shadow-lg shadow-gold/5" style={getTextStyle(config.hero?.badgeColor)}>
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            {config.hero?.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }} className="mb-6 px-2">
          <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tight text-white" style={getTextStyle(config.hero?.titleColor)}>
            {firstPart}
          </span>
          <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tight text-gradient-fire mt-2" style={!config.hero?.titleColor ? {} : getTextStyle(config.hero?.titleColor)}>
            {lastPart}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }} className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mb-6 leading-relaxed" style={getTextStyle(config.hero?.subtitleColor)}>
          {config.hero?.subtitle}
        </motion.p>

        {/* Rating */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.9 }} className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <StarRating rating={5} size="w-5 h-5" />
          <span className="text-gold font-extrabold text-lg">4.5</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400 text-sm font-medium">329 avaliações</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400 text-sm font-medium">10 – 15€ por pessoa</span>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.1 }} className="flex flex-col sm:flex-row gap-4">
          <motion.button
            onClick={() => (window as any).openReservationModal()}
            className="group relative px-8 py-4 bg-gradient-to-r from-gold via-flame to-ember rounded-full text-lg font-bold text-white shadow-2xl shadow-flame/30 overflow-hidden cursor-pointer"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2" style={getTextStyle(config.hero?.ctaColor)}>
              <span>📞</span> {config.hero?.ctaText || 'Reservar Mesa'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-ember via-flame to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.button>

          <motion.a
            href="#menu"
            className="group px-8 py-4 glass rounded-full text-lg font-semibold text-white hover:bg-white/15 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Ver Menu
            <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">Explorar</span>
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-2.5 bg-gold rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   ABOUT
   ═══════════════════════════════════════════ */

function About({ config }: { config: any }) {
  return (
    <section id="about" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-flame/3 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-royal/3 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Stats */}
        <AnimatedSection className="mb-20 md:mb-28">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -4, scale: 1.03 }}
                className="text-center p-5 md:p-8 glass rounded-2xl hover:border-gold/20 transition-all duration-500 group cursor-default"
              >
                <div className="text-3xl md:text-5xl font-black text-gradient-fire mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} decimal={stat.decimal} />
                </div>
                <div className="text-xs md:text-sm text-gray-400 font-medium group-hover:text-gray-300 transition-colors duration-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* About content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <AnimatedSection>
            <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs font-bold tracking-wider uppercase mb-6" style={getTextStyle(config.about?.badgeColor)}>
              {config.about?.badge || 'A Nossa História'}
            </span>
            <h2 className="text-3xl md:text-5xl font-black leading-tight mb-6" style={getTextStyle(config.about?.titleColor)}>
              {config.about?.title || 'Tradição e Sabor'}
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4 text-base md:text-lg" style={getTextStyle(config.about?.text1Color)}>
              {config.about?.text1 || 'Na Churrasqueira Amores, cada frango é uma obra de arte.'}
            </p>
            <p className="text-gray-400 leading-relaxed mb-8" style={getTextStyle(config.about?.text2Color)}>
              {config.about?.text2}
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                { icon: '🍗', text: 'Frango na Brasa' },
                { icon: '🥔', text: 'Batatas Caseiras' },
                { icon: '🔥', text: 'Carvão Vegetal' },
                { icon: '👨‍👩‍👧‍👦', text: 'Ambiente Familiar' },
              ].map((tag) => (
                <motion.div
                  key={tag.text}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl cursor-default hover:border-gold/20 transition-colors duration-300"
                >
                  <span className="text-lg">{tag.icon}</span>
                  <span className="text-sm font-medium">{tag.text}</span>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          {/* Image composition */}
          <AnimatedSection delay={0.2} className="relative">
            <motion.div className="relative rounded-3xl overflow-hidden shadow-2xl fire-glow" whileHover={{ scale: 1.02 }} transition={{ duration: 0.5 }}>
              <img
                src={config.about?.image}
                alt="Churrasqueira"
                className="w-full h-72 md:h-[480px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/70 via-transparent to-transparent" />
            </motion.div>

            {/* Floating badge */}
            <motion.div
              className="absolute -bottom-5 -left-3 md:-left-8 bg-gradient-to-br from-gold via-flame to-ember p-5 md:p-6 rounded-2xl shadow-2xl shadow-flame/30"
              initial={{ opacity: 0, scale: 0, rotate: -20 }}
              whileInView={{ opacity: 1, scale: 1, rotate: -6 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6, type: 'spring', bounce: 0.3 }}
              whileHover={{ rotate: 0, scale: 1.1 }}
            >
              <div className="text-3xl md:text-4xl font-black text-white">4.5★</div>
              <div className="text-xs md:text-sm font-semibold text-white/80">Google Reviews</div>
            </motion.div>

            {/* Price tag */}
            <motion.div
              className="absolute -top-3 -right-3 md:-right-6 glass p-4 rounded-xl shadow-xl"
              initial={{ opacity: 0, x: 20, rotate: 5 }}
              whileInView={{ opacity: 1, x: 0, rotate: 3 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ rotate: 0, scale: 1.05 }}
            >
              <div className="text-sm font-bold flex items-center gap-1">💰 10 – 15€</div>
              <div className="text-xs text-gray-400 mt-0.5">por pessoa</div>
            </motion.div>

            {/* Service tags */}
            <motion.div
              className="absolute bottom-6 right-4 flex gap-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              {['🍽️ Local', '🥡 Takeaway', '🛵 Entrega'].map((s) => (
                <span key={s} className="px-2.5 py-1.5 bg-deep/80 backdrop-blur-sm rounded-full text-[10px] md:text-xs font-semibold border border-white/10">
                  {s}
                </span>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   MENU
   ═══════════════════════════════════════════ */

function Menu({ config }: { config: any }) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const categories = ['Todos', 'Pratos', 'Acompanhamentos', 'Bebidas'];
  const filtered = activeCategory === 'Todos' ? config.menuItems : config.menuItems?.filter((m: any) => m.category === activeCategory);

  return (
    <section id="menu" className="relative py-20 md:py-32">
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep via-surface/20 to-deep pointer-events-none" />
      <div className="absolute top-1/4 -left-40 w-80 h-80 bg-royal/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-flame/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-flame/10 border border-flame/20 rounded-full text-flame text-xs font-bold tracking-wider uppercase mb-6">
            Menu & Destaques
          </span>
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
            Os Nossos{' '}
            <span className="text-gradient-fire">Pratos Estrela</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Cada prato é preparado com ingredientes frescos e o amor de uma tradição familiar
          </p>
        </AnimatedSection>

        {/* Category filter */}
        <AnimatedSection className="flex justify-center gap-2 mb-12 flex-wrap">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${activeCategory === cat
                ? 'bg-gradient-to-r from-gold via-flame to-ember text-white shadow-lg shadow-flame/25'
                : 'glass text-gray-400 hover:text-white hover:border-gold/20'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat}
            </motion.button>
          ))}
        </AnimatedSection>

        {/* Grid */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="group"
              >
                <motion.div
                  className="glass rounded-2xl overflow-hidden hover:border-gold/20 transition-all duration-500 h-full flex flex-col"
                  whileHover={{ y: -8 }}
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <motion.img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-deep/10 to-transparent" />
                    {/* Shine sweep */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    {/* Tag */}
                    {item.tag && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-deep/70 backdrop-blur-sm rounded-full text-xs font-bold border border-white/10">
                        {item.tag}
                      </div>
                    )}
                    {/* Price */}
                    <motion.div
                      className="absolute bottom-3 right-3 px-4 py-2 bg-gradient-to-r from-gold to-flame rounded-full text-sm font-extrabold shadow-lg shadow-flame/30"
                      whileHover={{ scale: 1.1 }}
                    >
                      {item.price}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-5 md:p-6 flex-1 flex flex-col">
                    <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-gold transition-colors duration-300" style={getTextStyle(item.nameColor)}>{item.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed flex-1" style={getTextStyle(item.descColor)}>{item.description}</p>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">{item.category}</span>
                      <motion.span className="text-gold text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300" whileHover={{ x: 3 }}>
                        Pedir →
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   GALLERY
   ═══════════════════════════════════════════ */

function Gallery({ config }: { config: any }) {
  return (
    <section id="gallery" className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-deep via-midnight/20 to-deep pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-royal/10 border border-royal/20 rounded-full text-royal-light text-xs font-bold tracking-wider uppercase mb-6">
            Galeria
          </span>
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
            Momentos <span className="text-gradient-royal">Deliciosos</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Fotografias dos nossos pratos e do ambiente acolhedor da Churrasqueira Amores
          </p>
        </AnimatedSection>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {config.gallery?.map((img: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
            >
              <img
                src={img.url}
                alt={img.label}
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${i === 0 ? 'h-60 md:h-full' : 'h-44 md:h-60'}`}
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-5 md:p-6">
                <motion.span
                  className="text-sm md:text-lg font-bold"
                  initial={false}
                >
                  {img.label}
                </motion.span>
              </div>
              {/* Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-in-out" />
              {/* Border glow on hover */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gold/30 transition-colors duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   REVIEWS
   ═══════════════════════════════════════════ */

function Reviews() {
  const ratingDistribution: Record<number, number> = { 5: 75, 4: 18, 3: 4, 2: 2, 1: 1 };

  return (
    <section id="reviews" className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-royal/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-gold/4 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs font-bold tracking-wider uppercase mb-6">
            Críticas dos Clientes
          </span>
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-6">
            O Que <span className="text-gradient-fire">Dizem de Nós</span>
          </h2>

          {/* Avatar group */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex -space-x-3">
              {REVIEWS.slice(0, 5).map((r) => (
                <motion.div
                  key={r.id}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-deep flex items-center justify-center text-xs md:text-sm font-bold shadow-lg"
                  style={{ backgroundColor: r.color }}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                >
                  {r.avatar}
                </motion.div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <StarRating rating={5} size="w-3.5 h-3.5" />
                <span className="text-gold font-extrabold">4.5</span>
              </div>
              <p className="text-xs text-gray-500">329 avaliações no Google</p>
            </div>
          </div>
        </AnimatedSection>

        {/* Rating bars */}
        <AnimatedSection className="mb-14 max-w-sm mx-auto">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3 mb-2.5">
              <span className="text-xs text-gray-400 w-3 font-medium">{star}</span>
              <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold to-flame rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${ratingDistribution[star]}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: (5 - star) * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 font-medium">{ratingDistribution[star]}%</span>
            </div>
          ))}
        </AnimatedSection>

        {/* Review cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-6 hover:border-gold/15 transition-all duration-500 group flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shadow-lg"
                  style={{ backgroundColor: review.color }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {review.avatar}
                </motion.div>
                <div>
                  <h4 className="font-semibold text-sm">{review.name}</h4>
                  <p className="text-[11px] text-gray-500">
                    {review.reviewCount} • {review.date}
                  </p>
                </div>
              </div>

              <StarRating rating={review.rating} size="w-3.5 h-3.5" />

              <p className="text-gray-300 text-sm leading-relaxed mt-3 flex-1">"{review.text}"</p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-gray-500">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google Reviews</span>
                <span className="text-gold font-semibold">✓ Verificado</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* More reviews */}
        <AnimatedSection className="text-center mt-10">
          <motion.a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 glass rounded-full text-sm font-semibold text-gray-300 hover:text-gold hover:border-gold/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ver todas as 329 críticas
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </motion.a>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════ */

function Contact({ config }: { config: any }) {
  const infoCards = [
    {
      icon: '📍',
      title: 'Localização',
      gradient: 'from-gold via-flame to-ember',
      shadowColor: 'shadow-flame/20',
      content: (
        <>
          <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
            {config.contact?.address}
          </p>
          <a
            href={config.contact?.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold text-sm font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            Ver no Google Maps
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </>
      ),
    },
    {
      icon: '🕐',
      title: 'Horário',
      gradient: 'from-royal to-royal-light',
      shadowColor: 'shadow-royal/20',
      content: (
        <>
          <div className="space-y-2.5 mb-4">
            {config.contact?.hours?.map((h: any) => (
              <div key={h.day} className="flex justify-between text-sm">
                <span className="text-gray-400">{h.day}</span>
                <span className="font-medium">{h.time}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-2.5 bg-ember/10 border border-ember/20 rounded-xl">
            <p className="text-ember text-xs font-semibold">⚠️ Verificar horário atualizado</p>
          </div>
        </>
      ),
    },
    {
      icon: '📞',
      title: 'Contato',
      gradient: 'from-flame to-ember',
      shadowColor: 'shadow-ember/20',
      content: (
        <>
          <div className="space-y-3 mb-5">
            <a href={`tel:${config.contact?.phone?.replace(/\s/g, '')}`} className="flex items-center gap-3 text-gray-300 hover:text-gold transition-colors group">
              <span className="text-lg">📱</span>
              <span className="font-semibold group-hover:underline">{config.contact?.phone}</span>
            </a>
            <a href={config.contact?.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-300 hover:text-gold transition-colors group">
              <span className="text-lg">📘</span>
              <span className="font-semibold group-hover:underline">Facebook</span>
            </a>
            {config.contact?.email && (
              <a href={`mailto:${config.contact.email}`} className="flex items-center gap-3 text-gray-300 hover:text-gold transition-colors group">
                <span className="text-lg">📧</span>
                <span className="font-semibold group-hover:underline">{config.contact.email}</span>
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {config.footer?.services?.map((s: string) => (
              <span key={s} className="px-3 py-1.5 bg-white/5 rounded-full text-[11px] font-semibold">{s}</span>
            ))}
          </div>
        </>
      ),
    },
  ];

  return (
    <section id="contact" className="relative py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-deep via-surface/15 to-deep pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-flame/10 border border-flame/20 rounded-full text-flame text-xs font-bold tracking-wider uppercase mb-6" style={getTextStyle(config.contact?.badgeColor)}>
            {config.contact?.badge || 'Visite-nos'}
          </span>
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4" style={getTextStyle(config.contact?.titleColor)}>
            {config.contact?.title || 'Venha Conhecer-nos'}
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto" style={getTextStyle(config.contact?.textColor)}>
            {config.contact?.text}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-5 md:gap-7 mb-16">
          {infoCards.map((card, i) => (
            <AnimatedSection key={card.title} delay={i * 0.12}>
              <motion.div className="glass rounded-2xl p-7 md:p-8 hover:border-gold/15 transition-all duration-500 h-full" whileHover={{ y: -6 }}>
                <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center text-2xl mb-6 shadow-lg ${card.shadowColor}`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                {card.content}
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Big CTA */}
        <AnimatedSection>
          <div className="relative rounded-3xl overflow-hidden">
            {/* BG image */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=500&fit=crop&q=80"
                alt="Ambiente"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-deep/85 backdrop-blur-sm" />
            </div>

            {/* Decorative glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-flame/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative p-8 md:p-16 text-center">
              <motion.h3
                className="text-2xl md:text-4xl lg:text-5xl font-black mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                Pronto para <span className="text-gradient-fire">Saborear</span>?
              </motion.h3>
              <p className="text-gray-300 max-w-xl mx-auto mb-8 text-base md:text-lg leading-relaxed">
                Reserve a sua mesa e venha descobrir porque somos uma das melhores churrasqueiras do Algarve. O nosso frango espera por si!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={() => (window as any).openReservationModal()}
                  className="group relative px-8 py-4 bg-gradient-to-r from-gold via-flame to-ember rounded-full text-base md:text-lg font-bold text-white shadow-2xl shadow-flame/30 overflow-hidden cursor-pointer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">📞 Reservar Agora</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-ember via-flame to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.button>
                <motion.a
                  href="https://maps.google.com/?q=Churrasqueira+Amores+Odiaxere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 glass rounded-full text-base md:text-lg font-semibold hover:bg-white/15 transition-all duration-300 hover:border-gold/20"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  📍 Como Chegar
                </motion.a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */

function Footer({ config }: { config: any }) {
  return (
    <footer className="relative bg-surface/30 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold via-flame to-ember flex items-center justify-center shadow-lg shadow-flame/20 overflow-hidden">
                {config.logoIsImage ? (
                  <img src={config.logo} alt={`Logótipo ${config.hero?.title}`} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-xl" aria-hidden="true">{config.logo || '🔥'}</span>
                )}
              </div>
              <div>
                <span className="text-sm font-bold">{config.hero?.title?.split(' ')[0]}</span>
                <span className="text-gold font-extrabold ml-1">{config.hero?.title?.split(' ').slice(1).join(' ')}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              O autêntico sabor do frango na brasa no coração do Algarve. Uma tradição familiar desde 2009.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-gray-200 flex items-center gap-2"><span className="text-gold">🧭</span> Navegação</h4>
            <div className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-gray-400 hover:text-gold transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-gray-200 flex items-center gap-2"><span className="text-gold">ℹ️</span> Informações</h4>
            <div className="space-y-2.5 text-sm text-gray-400">
              {config.footer?.info?.map((info: string) => (
                <p key={info}>{info}</p>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-gray-200 flex items-center gap-2"><span className="text-gold">⭐</span> Serviços</h4>
            <div className="space-y-2.5 text-sm text-gray-400">
              {config.footer?.services?.map((svc: string) => (
                <p key={svc}>{svc}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Churrasqueira Amores Lda. Todos os direitos reservados.</p>
          <div className="flex gap-5">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gold transition-colors text-xs font-medium p-2" aria-label="Visite o nosso Facebook">
              Facebook
            </a>
            <a
              href="https://maps.google.com/?q=Churrasqueira+Amores+Odiaxere"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gold transition-colors text-xs font-medium p-2"
              aria-label="Ver localização no Google Maps"
            >
              Google Maps
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   RESERVATION MODAL
   ═══════════════════════════════════════════ */

function ReservationModal({ config, onClose }: { config: any, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    menu_item: '',
    date: '',
    time: '',
    people: 2
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .insert([{
          ...formData,
          is_read: false,
          status: 'pending'
        }]);

      if (error) throw error;

      // WhatsApp Logic
      const message = `Olá! Gostaria de fazer uma reserva na Churrasqueira Amores.%0A%0A*Detalhes da Reserva:*%0A👤 *Nome:* ${formData.name}%0A📱 *Telemóvel:* ${formData.phone}%0A📧 *Email:* ${formData.email}%0A🗓️ *Data:* ${new Date(formData.date).toLocaleDateString('pt-PT')}%0A⏰ *Hora:* ${formData.time}%0A👥 *Pessoas:* ${formData.people}%0A🍽️ *Pedido:* ${formData.menu_item || 'Não especificado'}`;

      const whatsappUrl = `https://wa.me/351282798417?text=${message}`;

      setSuccess(true);
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        onClose();
      }, 2000);

    } catch (err) {
      console.error(err);
      alert('Erro ao processar reserva. Por favor tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-deep border border-gold/20 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.12)] max-h-[90vh] overflow-y-auto"
      >
        {success ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-1">Muito Obrigado!</h2>
              <p className="text-sm text-gray-400">Reserva recebida com sucesso!</p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 text-gold animate-spin" />
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-black text-white leading-tight">Fazer Reserva</h2>
                <p className="text-[9px] text-gold font-bold uppercase tracking-widest leading-none">Churrasqueira Amores</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nome Completo</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome"
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Telemóvel / WA</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9xx xxx xxx"
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">E-mail</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Data</label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none invert-calendar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Hora</label>
                  <select
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none appearance-none"
                  >
                    <option value="">Hora...</option>
                    {['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Pessoas</label>
                  <select
                    value={formData.people}
                    onChange={e => setFormData({ ...formData, people: parseInt(e.target.value) })}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 15].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Pes.' : 'Pes.'}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Prato (Opcional)</label>
                  <select
                    value={formData.menu_item}
                    onChange={e => setFormData({ ...formData, menu_item: e.target.value })}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {config.menuItems?.map((item: any) => (
                      <option key={item.id} value={`${item.name} - €${Number(item.price).toFixed(2)}`}>
                        {item.name} - €{Number(item.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-gold via-flame to-ember text-white rounded-xl font-black text-sm shadow-lg shadow-flame/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Reserva'}
              </button>
              <p className="text-[8px] text-gray-500 text-center uppercase tracking-tighter opacity-60">
                A redirecionar para o WhatsApp após confirmar
              </p>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(DEFAULT_CONFIG);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showReservation, setShowReservation] = useState(false);

  // Global triggers for modal
  useEffect(() => {
    (window as any).openReservationModal = () => setShowReservation(true);
  }, []);

  useEffect(() => {
    // Initial load
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('config')
          .eq('id', 1)
          .single();

        if (error) throw error;
        if (data?.config) {
          setConfig({ ...DEFAULT_CONFIG, ...data.config });
        }
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();

    // Subtle timer fallback
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Dynamic SEO & Meta tags
    const siteTitle = config.hero?.title || 'Churrasqueira Amores';
    document.title = siteTitle;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', config.hero?.subtitle || 'O autêntico sabor do frango na brasa no Algarve.');

    // Set Theme Color for Mobile
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', '#030825'); // deep color
  }, [config.hero]);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-[100] bg-deep flex flex-col items-center justify-center"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.div
              className="w-28 h-28 rounded-full bg-gradient-to-br from-gold via-flame to-ember flex items-center justify-center shadow-2xl shadow-flame/40 mb-6 overflow-hidden"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {config.logoIsImage ? (
                <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{config.logo || '🔥'}</span>
              )}
            </motion.div>
            <motion.p
              className="text-lg font-bold text-gradient-fire"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              aria-live="polite"
            >
              {config.hero?.title}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-deep min-h-screen text-white font-display noise-overlay selection:bg-gold/30">
        <Navbar config={config} onOpenAdmin={() => setShowAdmin(true)} />
        <Hero config={config} />
        <About config={config} />
        <Menu config={config} />
        <Gallery config={config} />
        <Reviews />
        <Contact config={config} />
        <Footer config={config} />
      </div>

      <AnimatePresence>
        {showAdmin && (
          <Admin
            config={config}
            onClose={() => setShowAdmin(false)}
            onUpdate={(newConfig) => setConfig(newConfig)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReservation && (
          <ReservationModal
            config={config}
            onClose={() => setShowReservation(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
