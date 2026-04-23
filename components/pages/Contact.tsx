'use client'

import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import HeroSection from '../HeroSection';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    toast.success('Message envoyé !', {
      description: 'Nous vous répondrons dans les plus brefs délais.'
    });
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6 text-pink-500" />,
      title: 'Adresse',
      content: 'Avenue de la Paix, Gombe\nKinshasa, D.R. Congo',
      link: 'https://maps.google.com'
    },
    {
      icon: <Phone className="w-6 h-6 text-purple-500" />,
      title: 'Téléphone',
      content: '+243 123 456 789\n+243 987 654 321',
      link: 'tel:+243123456789'
    },
    {
      icon: <Mail className="w-6 h-6 text-amber-500" />,
      title: 'Email',
      content: 'contact@beautynails.cd\ninfo@beautynails.cd',
      link: 'mailto:contact@beautynails.cd'
    },
    {
      icon: <Clock className="w-6 h-6 text-green-500" />,
      title: 'Horaires',
      content: 'Lun - Sam: 09:00 - 19:00\nDimanche: Sur rendez-vous',
      link: null
    }
  ];

  const hours = [
    { day: 'Lundi', hours: '09:00 - 19:00' },
    { day: 'Mardi', hours: '09:00 - 19:00' },
    { day: 'Mercredi', hours: '09:00 - 19:00' },
    { day: 'Jeudi', hours: '09:00 - 19:00' },
    { day: 'Vendredi', hours: '09:00 - 19:00' },
    { day: 'Samedi', hours: '09:00 - 19:00' },
    { day: 'Dimanche', hours: 'Sur rendez-vous' }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <section className="bg-linear-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact
          </Badge>
          <h1 className="text-5xl text-gray-900 dark:text-gray-100 mb-6">
            Contactez-nous
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Une question ? Une demande spéciale ? Nous sommes là pour vous répondre
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ">

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {contactInfo.map((info, index) => (
            <Card key={index} className="bg-white dark:bg-gray-950 border-b border-pink-100 dark:border-pink-900 shadow-lg hover:shadow-xl transition-shadow p-6 sm:p-8 rounded-2xl text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                {info.icon}
              </div>
              <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">{info.title}</h3>
              {info.link ? (
                <a
                  href={info.link}
                  target={info.link.startsWith('http') ? '_blank' : undefined}
                  rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-lg sm:text-base text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 whitespace-pre-line transition-colors"
                >
                  {info.content}
                </a>
              ) : (
                <p className="text-lg sm:text-base text-gray-600 dark:text-gray-300 whitespace-pre-line">{info.content}</p>
              )}
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-950 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-6 sm:mb-8">Envoyez-nous un message</h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="name" className="dark:text-gray-200">Nom complet *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Marie Kabila"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="dark:text-gray-200">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="marie@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="phone" className="dark:text-gray-200">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+243 123 456 789"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="dark:text-gray-200">Sujet</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="Demande d'information"
                      value={formData.subject}
                      onChange={handleChange}
                      className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="dark:text-gray-200">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Votre message..."
                    value={formData.message}
                    onChange={handleChange}
                    className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 min-h-[150px] text-lg"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full py-5 sm:py-6 text-lg sm:text-base"
                >
                  Envoyer le message
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* WhatsApp Card */}
            <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-900 shadow-lg p-6 sm:p-8 rounded-2xl">
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">WhatsApp</h3>
                <p className="text-lg sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                  Contactez-nous directement pour une réponse rapide
                </p>
                <a href="https://wa.me/243123456789" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-full py-4 sm:py-5 text-base sm:text-lg">
                    Ouvrir WhatsApp
                  </Button>
                </a>
              </div>
            </Card>

            {/* Hours Card */}
            <Card className="bg-white dark:bg-gray-950 border-b border-pink-100 dark:border-pink-900 shadow-lg p-6 sm:p-8 rounded-2xl">
              <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-pink-500" />
                Horaires d'ouverture
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {hours.map((item, index) => (
                  <div key={index} className="flex justify-between text-base sm:text-lg">
                    <span className="text-gray-700 dark:text-gray-300">{item.day}</span>
                    <span className={`${item.hours === 'Sur rendez-vous' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Social Media Card */}
            <Card className="bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-b border-pink-100 dark:border-pink-900 shadow-lg p-6 sm:p-8 rounded-2xl">
              <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Suivez-nous</h3>
              <div className="space-y-2 sm:space-y-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-base sm:text-lg ">
                    F
                  </div>
                  <span className="text-lg sm:text-base text-gray-700 dark:text-gray-300">Facebook</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 flex items-center justify-center text-white text-base sm:text-lg ">
                    I
                  </div>
                  <span className="text-lg sm:text-base text-gray-700 dark:text-gray-300">Instagram</span>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-400 dark:bg-blue-500 flex items-center justify-center text-white text-base sm:text-lg ">
                    T
                  </div>
                  <span className="text-lg sm:text-base text-gray-700 dark:text-gray-300">Twitter</span>
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 sm:mt-24">
          <Card className="bg-white dark:bg-gray-950 border-b border-pink-100 dark:border-pink-900 shadow-xl rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-8 bg-linear-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
              <h2 className="text-2xl  sm:text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <MapPin className="w-6 h-6 mr-2 sm:mr-3 text-pink-500" />
                Notre Emplacement
              </h2>
            </div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400 px-4">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7976.265327690709!2d29.19361407041877!3d-1.6655623737073957!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dd0f314211f117%3A0x853637f77640d4c0!2sHimbi!5e0!3m2!1sen!2srw!4v1772725988080!5m2!1sen!2srw"
                  width="1210" height="720"
                  style={{ border: "1", borderRadius: "1rem", boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px" }}
                  loading="lazy" ></iframe>
                {/* <MapPin className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-gray-600" />
                <p className="text-lg sm:text-base mb-1">Q. Birere, Comune de Goma, Goma – RDC</p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-base sm:text-lg inline-block transition-colors"
                >
                  Voir sur Google Maps →
                </a> */}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
