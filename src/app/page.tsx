'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Monitor, Server, Code, Gamepad2, Users, Zap, Shield, Globe, ChevronRight, Menu, X, TrendingUp, Activity, Clock, Star, Cpu, Database, Cloud, Lock, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/logo'

interface StatsData {
  totalUsers: number
  totalServices: number
  totalOrders: number
  totalRevenue: number
  recentUsers: number
  recentServices: number
  servicesByType: Array<{ type: string; _count: { type: number } }>
  uptime: string
  lastUpdated: string
}

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitMessage('Pesan Anda telah terkirim! Kami akan segera menghubungi Anda.')
        setContactForm({ name: '', email: '', message: '' })
      } else {
        setSubmitMessage(data.error || 'Terjadi kesalahan. Silakan coba lagi.')
      }
    } catch (error) {
      setSubmitMessage('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm(prev => ({ ...prev, [name]: value }))
  }

  const services = [
    {
      icon: <Server className="w-8 h-8" />,
      title: "Game Hosting",
      description: "Server game hosting dengan performa tinggi dan latency rendah untuk pengalaman gaming terbaik",
      features: ["99.9% Uptime", "DDoS Protection", "Auto Backup", "24/7 Support"],
      gradient: "from-pink-500 to-purple-600",
      pricing: "Mulai dari Rp 50K/bulan"
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "RDP Premium",
      description: "Remote Desktop Protocol dengan spesifikasi tinggi untuk kebutuhan computing anda",
      features: ["High Performance", "Full Admin Access", "Unlimited Bandwidth", "Windows Server"],
      gradient: "from-purple-600 to-blue-600",
      pricing: "Mulai dari Rp 75K/bulan"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Development Services",
      description: "Jasa development khusus untuk FiveM dan Roblox dengan tim profesional",
      features: ["Custom Scripts", "UI/UX Design", "Database Setup", "Optimization"],
      gradient: "from-blue-600 to-pink-500",
      pricing: "Mulai dari Rp 500K/project"
    }
  ]

  const testimonials = [
    {
      name: "Rowens ID",
      role: "Developer",
      content: "Tim development sangat profesional. Custom script yang kami pesan sesuai ekspektasi dan berkualitas tinggi. Highly recommended!",
      rating: 5
    },
    {
      name: "Amerta Roleplay",
      role: "Game Server Owner",
      content: "Layanan hosting terbaik yang pernah kami gunakan. Server selalu stabil dan support sangat responsif untuk komunitas gaming kami!",
      rating: 5
    },
    {
      name: "Mylo",
      role: "Content Creator",
      content: "RDP premium dengan performa luar biasa. Server development kami jadi lancar tanpa lag sama sekali. Best service ever!",
      rating: 5
    }
  ]

  const features = [
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "High Performance",
      description: "Server dengan spesifikasi tinggi dan teknologi terkini"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Keamanan Terjamin",
      description: "Perlindungan DDoS dan enkripsi data terstandar"
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: "Cloud Technology",
      description: "Infrastruktur cloud yang scalable dan reliable"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Data Privacy",
      description: "Keamanan data privasi terjamin dengan enkripsi"
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-lg border-b border-white/10' : ''}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="hover:text-pink-400 transition-colors">Layanan</Link>
              <Link href="#features" className="hover:text-pink-400 transition-colors">Fitur</Link>
              <Link href="#stats" className="hover:text-pink-400 transition-colors">Statistik</Link>
              <Link href="#testimonials" className="hover:text-pink-400 transition-colors">Testimoni</Link>
              <Link href="/login">
                <Button variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  Daftar
                </Button>
              </Link>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-white/10">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link href="#services" className="block hover:text-pink-400 transition-colors">Layanan</Link>
              <Link href="#features" className="block hover:text-pink-400 transition-colors">Fitur</Link>
              <Link href="#stats" className="block hover:text-pink-400 transition-colors">Statistik</Link>
              <Link href="#testimonials" className="block hover:text-pink-400 transition-colors">Testimoni</Link>
              <Link href="/login" className="block">
                <Button variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white w-full">
                  Login
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 w-full">
                  Daftar
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-blue-900/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none">
            <Zap className="w-4 h-4 mr-2" />
            Creative Studio & Premium Hosting Services
          </Badge>
          
          <div className="mb-8">
            <Logo size="xl" className="justify-center mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
              Creative Studio
            </span>
            <br />
            <span className="text-white">& Development Solutions</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto">
            Solusi kreatif untuk kebutuhan digital anda. Game hosting premium, RDP berkualitas, dan jasa development profesional dengan sentuhan artistik yang unik.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg px-8 py-3">
                Mulai Sekarang
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#services">
              <Button size="lg" variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white text-lg px-8 py-3">
                Lihat Layanan
              </Button>
            </Link>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-gray-900/50 border-white/10 backdrop-blur-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-8 h-8 bg-gray-700 rounded-full mx-auto mb-2 animate-pulse" />
                    <div className="w-12 h-4 bg-gray-700 rounded mx-auto mb-1 animate-pulse" />
                    <div className="w-16 h-3 bg-gray-700 rounded mx-auto animate-pulse" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-pink-500/50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                    <div className="text-sm text-gray-400">Klien Aktif</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-purple-500/50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Server className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats?.totalServices || 0}</div>
                    <div className="text-sm text-gray-400">Server Aktif</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-blue-500/50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats?.uptime || '99.9%'}</div>
                    <div className="text-sm text-gray-400">Uptime</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-green-500/50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {stats?.recentUsers || 0}+
                    </div>
                    <div className="text-sm text-gray-400">Klien Baru</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Mengapa Memilih Kami
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Kami menyediakan solusi terbaik dengan teknologi terkini dan support profesional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-pink-500/50 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Layanan Kami
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Solusi komprehensif untuk kebutuhan gaming dan development anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-pink-500/50 transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <CardTitle className="text-2xl text-white">{service.title}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-300">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-2" />
                        {feature}
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-pink-400 font-semibold">{service.pricing}</p>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      Pesan Sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Testimoni Klien
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Apa kata klien kami tentang layanan kami
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-pink-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <CardTitle className="text-xl text-white">{testimonial.name}</CardTitle>
                  <CardDescription className="text-gray-400">{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 border-white/10 backdrop-blur-lg">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Siap Memulai Proyek Anda?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Bergabunglah dengan ratusan klien yang telah mempercayai kami untuk kebutuhan digital mereka
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg px-8 py-3">
                    Daftar Sekarang
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button size="lg" variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white text-lg px-8 py-3">
                    Hubungi Kami
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Hubungi Kami
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Ada pertanyaan? Kami siap membantu anda menemukan solusi terbaik untuk kebutuhan digital anda.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Kirim Pesan</CardTitle>
                <CardDescription className="text-gray-300">
                  Isi form di bawah ini dan kami akan segera menghubungi anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      placeholder="Masukkan nama Anda"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Pesan
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      placeholder="Tuliskan pesan Anda di sini..."
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
                  </Button>
                  {submitMessage && (
                    <div className={`text-sm ${submitMessage.includes('error') ? 'text-red-400' : 'text-green-400'}`}>
                      {submitMessage}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Informasi Kontak</CardTitle>
                <CardDescription className="text-gray-300">
                  Berbagai cara untuk menghubungi kami
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-gray-400">info@asstudio.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Telepon</p>
                    <p className="text-gray-400">+62 812-3456-7890</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Alamat</p>
                    <p className="text-gray-400">Jakarta, Indonesia</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Jam Operasional</p>
                    <p className="text-gray-400">Senin - Jumat: 09:00 - 18:00</p>
                    <p className="text-gray-400">Sabtu: 09:00 - 15:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo size="md" className="mb-4" />
              <p className="text-gray-400">
                Creative studio & development solutions untuk kebutuhan digital anda.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Layanan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#services" className="hover:text-pink-400 transition-colors">Game Hosting</Link></li>
                <li><Link href="#services" className="hover:text-pink-400 transition-colors">RDP Premium</Link></li>
                <li><Link href="#services" className="hover:text-pink-400 transition-colors">Development Services</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Perusahaan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about" className="hover:text-pink-400 transition-colors">Tentang Kami</Link></li>
                <li><Link href="#contact" className="hover:text-pink-400 transition-colors">Kontak</Link></li>
                <li><Link href="#careers" className="hover:text-pink-400 transition-colors">Karir</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Hubungi Kami</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@asstudio.com</li>
                <li>Phone: +62 812-3456-7890</li>
                <li>Address: Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2024 A&S Studio Project. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}