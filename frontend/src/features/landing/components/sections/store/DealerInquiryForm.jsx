import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import { saveDealerInquiry } from '../../../data/storeConfig';

export default function DealerInquiryForm({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    city: '',
    state: '',
    businessExperience: '',
    availableInvestment: '',
    showroomArea: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.email || !formData.city || !formData.state) {
      setError('Please fill in all required fields.');
      return;
    }
    
    // Save to local storage database
    saveDealerInquiry(formData);
    setIsSubmitted(true);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-2 rounded-full cursor-pointer transition-colors z-10"
        >
          <FiX size={20} />
        </button>

        {isSubmitted ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle size={36} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 font-display mb-2">Application Submitted!</h3>
            <p className="text-zinc-500 font-light leading-relaxed mb-6">
              Thank you for your interest in Haion EV Dealership. Our partnership team will review your details and contact you shortly.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  fullName: '',
                  mobileNumber: '',
                  email: '',
                  city: '',
                  state: '',
                  businessExperience: '',
                  availableInvestment: '',
                  showroomArea: '',
                  message: ''
                });
                onClose();
              }}
              className="bg-gradient-to-r from-zinc-950 to-amber-500 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 font-display mb-2">Dealership Inquiry</h3>
            <p className="text-zinc-500 text-sm font-light leading-relaxed mb-6">
              Fill out this form to apply for an authorized dealership and showroom.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Enter full name"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@email.com"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Noida"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Business Experience</label>
                  <input
                    type="text"
                    name="businessExperience"
                    value={formData.businessExperience}
                    onChange={handleChange}
                    placeholder="e.g. 5 Years in Retail"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Available Investment</label>
                  <input
                    type="text"
                    name="availableInvestment"
                    value={formData.availableInvestment}
                    onChange={handleChange}
                    placeholder="e.g. ₹20 Lakhs"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Showroom Area (sq. ft.)</label>
                  <input
                    type="text"
                    name="showroomArea"
                    value={formData.showroomArea}
                    onChange={handleChange}
                    placeholder="e.g. 1500 sq.ft."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Additional Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Tell us about your business profile..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-zinc-950 to-amber-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-[1.01] cursor-pointer"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
