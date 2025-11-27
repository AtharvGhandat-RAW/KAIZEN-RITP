import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('queries')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'new'
        });

      if (error) throw error;

      toast.success('Message sent successfully!', {
        description: 'We will get back to you soon.'
      });

      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting query:', error);
      toast.error('Failed to send message', {
        description: 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact" className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-[1440px] mx-auto">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl text-white/90 mb-4" style={{
          textShadow: '0 0 30px rgba(255, 69, 0, 0.3)'
        }}>
          Get In Touch
        </h2>
        <p className="text-white/60 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
          Have questions? We'd love to hear from you.
        </p>
        <div className="h-px w-20 sm:w-24 md:w-32 bg-gradient-to-r from-transparent via-red-600/60 to-transparent mx-auto mt-6" />
      </div>

      <div className="max-w-3xl mx-auto overflow-x-hidden w-full px-4">
        <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-sm border border-red-600/20 p-6 sm:p-8 md:p-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-red-400/90 text-sm mb-2">Your Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-red-900/50 px-4 py-3 text-white placeholder:text-red-800/50 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/50 transition-all duration-300"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-red-400/90 text-sm mb-2">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-red-900/50 px-4 py-3 text-white placeholder:text-red-800/50 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/50 transition-all duration-300"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="subject" className="block text-red-400/90 text-sm mb-2">Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full bg-black/50 border border-red-900/50 px-4 py-3 text-white placeholder:text-red-800/50 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/50 transition-all duration-300"
              placeholder="Your subject here"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="message" className="block text-red-400/90 text-sm mb-2">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full bg-black/50 border border-red-900/50 px-4 py-3 text-white placeholder:text-red-800/50 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/50 transition-all duration-300 resize-none"
              placeholder="Your message here..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group relative px-8 py-4 border-2 border-red-700 bg-gradient-to-r from-red-900/40 via-red-800/30 to-red-900/40 hover:from-red-900/60 hover:via-red-800/50 hover:to-red-900/60 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
            style={{
              boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
            }}
          >
            <span className="relative z-10 text-base sm:text-lg">
              {loading ? 'Sending...' : 'Send Message'}
            </span>
            {!loading && <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />}
          </button>
        </form>
      </div>
    </section>
  );
}
