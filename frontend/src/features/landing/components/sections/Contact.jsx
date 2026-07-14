import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal, SectionHeading, GlassCard } from '../ui';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle } from 'react-icons/fi';
import { useCMSPage, useCMSSettings } from '../../cms/CMSContext';
import { pickCms } from '../../cms/cms-defaults';

export default function Contact() {
  const { getSection } = useCMSPage();
  const settings = useCMSSettings();
  const section = getSection('contact');
  const globalContact = settings.contact ?? {};

  const email = pickCms(globalContact.email, section.email);
  const phone = pickCms(globalContact.phone, section.phone);
  const address = pickCms(globalContact.address, section.address);

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setIsLoading(true);
    // Simulate API Submission
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      
      // Clear toast
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <section id="contact" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        <SectionHeading
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8 text-left">
            <ScrollReveal className="h-full">
              <div className="glassmorphism rounded-3xl p-8 flex flex-col justify-between h-full border-black/5">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-6 font-display">
                    {section.infoHeading || 'Contact Information'}
                  </h3>
                  <p className="text-zinc-500 text-sm font-light leading-relaxed mb-8">
                    {section.infoBody || 'Feel free to reach out directly. Our dedicated expert support teams are here to help.'}
                  </p>

                  <div className="space-y-6">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                        <FiMail size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">{section.emailLabel || 'Email Us'}</div>
                        <a href={`mailto:${email}`} className="text-sm font-semibold text-zinc-800 hover:text-purple-600 transition-colors">{email}</a>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                        <FiPhone size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">{section.phoneLabel || 'Call Support'}</div>
                        <a href={`tel:${phone}`} className="text-sm font-semibold text-zinc-800 hover:text-purple-600 transition-colors">{phone}</a>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                        <FiMapPin size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">{section.hqLabel || 'Headquarters'}</div>
                        <span className="text-sm font-semibold text-zinc-800">{address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-black/5 text-[10px] text-zinc-400">
                  Customer response time average: {section.responseTime || '< 5 minutes'}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <ScrollReveal delay={0.1}>
              <GlassCard className="p-8 md:p-10 text-left h-full flex flex-col justify-between border-black/5" hoverEffect={false}>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-6 font-display">
                    {section.formHeading || 'Send a Message'}
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="text-[10px] text-zinc-400 uppercase font-semibold block mb-2">{section.formNameLabel || 'Your Name'}</label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={section.formNamePlaceholder || 'John Doe'}
                        className="w-full bg-black/5 border border-black/5 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-850 focus:outline-none transition-colors placeholder:text-zinc-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="text-[10px] text-zinc-400 uppercase font-semibold block mb-2">{section.formEmailLabel || 'Email Address'}</label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={section.formEmailPlaceholder || 'john@example.com'}
                        className="w-full bg-black/5 border border-black/5 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-850 focus:outline-none transition-colors placeholder:text-zinc-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="text-[10px] text-zinc-400 uppercase font-semibold block mb-2">{section.formMessageLabel || 'Message'}</label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={section.formMessagePlaceholder || 'How can we help you?'}
                        className="w-full bg-black/5 border border-black/5 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-850 focus:outline-none transition-colors resize-none placeholder:text-zinc-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-[0_8px_25px_rgba(168,85,247,0.2)] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <span>{section.submittingLabel || 'Sending message...'}</span>
                      ) : (
                        <>
                          <FiSend />
                          <span>{section.submitLabel || 'Send Message'}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Toast Success Message */}
                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center gap-2 text-xs font-semibold"
                    >
                      <FiCheckCircle size={16} />
                      <span>{section.successMessage || 'Thank you! Your inquiry was submitted. We will email you back shortly.'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

              </GlassCard>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
}
