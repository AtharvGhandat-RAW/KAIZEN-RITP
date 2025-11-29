import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Github, ExternalLink, ChevronUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ContactFooter() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [contactInfo, setContactInfo] = useState([
    { icon: Mail, label: 'Email Us', value: 'info@kaizentechfest.com', link: 'mailto:info@kaizentechfest.com' },
    { icon: Phone, label: 'Call Us', value: '+91 1234 567 890', link: 'tel:+911234567890' },
    { icon: MapPin, label: 'Visit Us', value: 'RIT Campus, Bangalore, India', link: '#' }
  ]);
  const [socialLinks, setSocialLinks] = useState([
    { icon: Facebook, label: 'Facebook', link: '#', color: '#1877f2' },
    { icon: Twitter, label: 'Twitter', link: '#', color: '#1da1f2' },
    { icon: Instagram, label: 'Instagram', link: '#', color: '#e4405f' },
    { icon: Linkedin, label: 'LinkedIn', link: '#', color: '#0a66c2' },
    { icon: Github, label: 'Github', link: '#', color: '#ffffff' }
  ]);

  useEffect(() => {
    fetchContactSettings();

    // Real-time listener
    const channel = supabase
      .channel('contact-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchContactSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchContactSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['contact_email', 'contact_phone', 'contact_address', 'social_facebook', 'social_twitter', 'social_instagram', 'social_linkedin', 'social_github']);

      if (error) throw error;

      if (data && data.length > 0) {
        const settings: Record<string, string> = {};
        data.forEach(item => {
          settings[item.key] = String(item.value);
        });

        // Update contact info
        setContactInfo([
          {
            icon: Mail,
            label: 'Email Us',
            value: settings.contact_email || 'info@kaizentechfest.com',
            link: `mailto:${settings.contact_email || 'info@kaizentechfest.com'}`
          },
          {
            icon: Phone,
            label: 'Call Us',
            value: settings.contact_phone || '+91 1234 567 890',
            link: `tel:${(settings.contact_phone || '').replace(/\s/g, '')}`
          },
          {
            icon: MapPin,
            label: 'Visit Us',
            value: settings.contact_address || 'RIT Campus, Bangalore, India',
            link: '#'
          }
        ]);

        // Update social links
        setSocialLinks([
          { icon: Facebook, label: 'Facebook', link: settings.social_facebook || '#', color: '#1877f2' },
          { icon: Twitter, label: 'Twitter', link: settings.social_twitter || '#', color: '#1da1f2' },
          { icon: Instagram, label: 'Instagram', link: settings.social_instagram || '#', color: '#e4405f' },
          { icon: Linkedin, label: 'LinkedIn', link: settings.social_linkedin || '#', color: '#0a66c2' },
          { icon: Github, label: 'Github', link: settings.social_github || '#', color: '#ffffff' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setSubscribing(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({ email });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('You are already subscribed!');
        } else {
          throw error;
        }
      } else {
        toast.success('Successfully subscribed to updates!');
        setEmail('');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const quickLinks = [
    { name: 'About KAIZEN', link: '#about' },
    { name: 'Events', link: '#events' },
    { name: 'Schedule', link: '/schedule' },
    { name: 'Registration', link: '#registration' },
    { name: 'Contact', link: '#contact' }
  ];

  return (
    <footer id="contact" className="relative border-t border-red-900/30 w-full overflow-x-hidden" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(10,0,0,1) 100%)' }}>
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(139, 0, 0, 0.15) 0%, transparent 60%)',
            filter: 'blur(80px)'
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 69, 0, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 69, 0, 0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full overflow-x-hidden">
        {/* Main Footer Content */}
        <div className="pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-8 sm:pb-10 md:pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 lg:gap-16">

            {/* Column 1: Brand */}
            <div className="text-center md:text-left">
              <h3
                className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px #ff4500',
                  textShadow: '0 0 10px rgba(255, 69, 0, 0.5), 0 0 20px rgba(255, 69, 0, 0.3)',
                  fontFamily: '"Benguiat", "ITC Benguiat", "Times New Roman", serif',
                  letterSpacing: '0.05em'
                }}
              >
                KAIZEN
              </h3>
              <p className="text-red-400/70 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                The Official Tech Fest of RIT — Stranger Things Edition
              </p>
              <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
                Dive into the upside down of technology. Experience innovation like never before.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="text-white text-base sm:text-lg md:text-xl mb-4 sm:mb-6 uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(255, 69, 0, 0.3)' }}>
                Quick Links
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    {link.link.startsWith('/') ? (
                      <Link
                        to={link.link}
                        className="group inline-flex items-center gap-2 text-white/60 hover:text-red-500 transition-all duration-300 text-sm sm:text-base"
                      >
                        <span className="w-0 h-px bg-red-500 group-hover:w-4 transition-all duration-300"></span>
                        {link.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>
                    ) : (
                      <a
                        href={link.link}
                        className="group inline-flex items-center gap-2 text-white/60 hover:text-red-500 transition-all duration-300 text-sm sm:text-base"
                      >
                        <span className="w-0 h-px bg-red-500 group-hover:w-4 transition-all duration-300"></span>
                        {link.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact Info */}
            <div className="text-center md:text-left">
              <h4 className="text-white text-base sm:text-lg md:text-xl mb-4 sm:mb-6 uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(255, 69, 0, 0.3)' }}>
                Contact Info
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {contactInfo.map((contact) => {
                  const Icon = contact.icon;
                  return (
                    <li key={contact.label}>
                      <a
                        href={contact.link}
                        className="group flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-white/60 hover:text-red-400 transition-colors duration-300"
                      >
                        <div className="flex-shrink-0 p-2 border border-red-900/40 group-hover:border-red-700/60 transition-all duration-300">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-white/40 text-xs uppercase tracking-wider mb-0.5">{contact.label}</div>
                          <div className="text-xs sm:text-sm">{contact.value}</div>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="text-center md:text-left">
              <h4 className="text-white text-base sm:text-lg md:text-xl mb-4 sm:mb-6 uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(255, 69, 0, 0.3)' }}>
                Stay Updated
              </h4>
              <p className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
                Subscribe to get the latest updates about events and activities.
              </p>
              <form onSubmit={handleSubscribe} className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={subscribing}
                  className="w-full bg-black/40 border border-red-900/40 px-3 py-2.5 sm:px-4 sm:py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-700/60 transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full mt-3 sm:mt-4 px-4 py-2.5 sm:px-6 sm:py-3 border border-red-600/60 bg-red-950/20 text-red-500 hover:bg-red-900/30 hover:border-red-500 transition-all duration-300 uppercase tracking-wider text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-red-900/40 to-transparent"></div>

        {/* Social Links Section */}
        <div className="py-6 sm:py-8 md:py-10">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <h4 className="text-white/70 text-xs sm:text-sm uppercase tracking-widest">Follow Us</h4>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3 sm:p-3.5 md:p-4 border border-red-900/40 hover:border-red-700/80 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                    aria-label={social.label}
                    style={{
                      animation: `fadeInScale 0.5s ease-out ${index * 0.1}s forwards`,
                      opacity: 0
                    }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:text-red-400 transition-colors duration-300" />
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-red-900/0 to-red-900/0 group-hover:from-red-900/20 group-hover:to-red-950/20 transition-all duration-300 pointer-events-none"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-red-900/40 to-transparent"></div>

        {/* Bottom Bar */}
        <div className="py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            {/* Copyright */}
            <div className="text-white/40 text-xs sm:text-sm text-center md:text-left">
              © 2024 KAIZEN Tech Fest. All Rights Reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-red-500 transition-colors duration-300">Privacy Policy</Link>
              <span className="text-white/20">•</span>
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-red-500 transition-colors duration-300">Terms & Conditions</Link>
              <span className="text-white/20">•</span>
              <Link to="/refund" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-red-500 transition-colors duration-300">Refund Policy</Link>
            </div>

            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 border border-red-900/40 text-red-500 hover:border-red-700 hover:bg-red-950/20 transition-all duration-300 text-xs sm:text-sm uppercase tracking-wider"
              aria-label="Back to top"
            >
              <span>Top</span>
              <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Decorative Corner Accents */}
        <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 border-l-2 border-red-900/30 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 border-r-2 border-red-900/30 pointer-events-none"></div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </footer>
  );
}
