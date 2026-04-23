import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-950 via-pink-950 to-amber-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

          {/* Brand */}
          <div className="text-center md:text-left">
            <Image
              src="/Bnails_ white.png"
              alt="Beauty Nails Logo"
              width={160}
              height={50}
              priority
            />
            <p className="text-gray-400 mt-3 text-lg leading-relaxed">
              La beauté commence au bout des doigts.
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3 text-lg text-gray-300 text-center">
            <div className="flex items-center justify-center space-x-2">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>Q. Birere, Goma – RDC</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Phone className="w-4 h-4 text-pink-400" />
              <a href="tel:+243973887148" className="hover:text-pink-300 transition">
                +243 973 887 148
              </a>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-4 h-4 text-pink-400" />
              <a href="mailto:contact@beautynails.cd" className="hover:text-pink-300 transition">
                contact@beautynails.cd
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="flex justify-center md:justify-end space-x-4">
            <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-pink-500 transition">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-pink-500 transition">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-8 pt-5 text-center text-base text-gray-500">
          © 2025 Beauty Nails Salon — Tous droits réservés.
        </div>

      </div>
    </footer>
  );
}