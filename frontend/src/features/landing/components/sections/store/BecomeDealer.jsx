import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../../ui';
import { FiBriefcase, FiCheckCircle, FiUserCheck, FiDollarSign, FiSettings, FiUsers, FiInfo } from 'react-icons/fi';
import DealerInquiryForm from './DealerInquiryForm';

export default function BecomeDealer({ content }) {
  const {
    heading = 'Become a Dealer',
    description = 'Join our growing electric mobility dealer network.',
    plans = [],
    benefits = [],
  } = content ?? {};
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <section className="mb-20">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gradient text-center font-display mb-6 tracking-tight">
          {heading}
        </h2>
        <p className="text-zinc-500 text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto">
          {description}
        </p>
      </div>

      {/* Investment Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id || idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <GlassCard className="h-full flex flex-col justify-between p-6 bg-white border border-zinc-200/50 shadow-sm rounded-2xl group transition-all duration-300">
              <div className="w-full flex flex-col items-center md:items-start text-center md:text-left">
                <h3 className="font-extrabold text-zinc-900 text-xl mb-4 font-display flex items-center justify-center md:justify-start gap-2 w-full">
                  <FiBriefcase className="text-purple-600" />
                  <span>{plan.level}</span>
                </h3>
                <div className="text-zinc-900 font-black text-2xl mb-2 font-display w-full">
                  {plan.investment}
                </div>
                <p className="text-zinc-550 text-sm font-semibold w-full">
                  {plan.requirement}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* DETAILED DEALERSHIP REQUIREMENTS SHEET */}
      <div className="bg-white border border-zinc-200/60 rounded-3xl p-8 md:p-12 shadow-sm text-left mb-12">
        {/* Document Header */}
        <div className="border-b border-zinc-100 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-emerald-600 font-display">
              Powersafe Industries Pvt Ltd
            </h3>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
              Electric Vehicles Manufacturer
            </p>
          </div>
          <div className="text-xs text-zinc-500 space-y-1 md:text-right">
            <div>Website: <a href="https://www.haion.co.in" target="_blank" rel="noreferrer" className="text-purple-600 font-bold hover:underline">www.haion.co.in</a></div>
            <div>Email: <a href="mailto:ev@haion.co.in" className="text-purple-600 font-bold hover:underline">ev@haion.co.in</a></div>
          </div>
        </div>

        <h4 className="text-xl font-bold text-zinc-900 mb-6 font-display flex items-center gap-2">
          <FiInfo className="text-purple-600" />
          How to Become a Haion Dealer
        </h4>
        <p className="text-zinc-500 text-sm font-light mb-8 leading-relaxed">
          Thank you for your interest in the dealership of Haion Scooter. Please read the following requirements for opening a dealership:
        </p>

        {/* Eligibility Criteria */}
        <div className="mb-8">
          <h5 className="font-bold text-zinc-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FiUserCheck className="text-emerald-500" /> Eligibility Criteria
          </h5>
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 text-sm text-zinc-700 leading-relaxed font-light">
            <strong>Experience:</strong> Minimum 1 year experience in the automotive industry. Willing to give time and dedication.
          </div>
        </div>

        {/* Investment Details Table */}
        <div className="mb-8">
          <h5 className="font-bold text-zinc-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FiDollarSign className="text-purple-600" /> Investment Structure
          </h5>
          <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-zinc-900 text-white font-bold font-display border-b border-zinc-200">
                  <th className="p-4">Type</th>
                  <th className="p-4">Investment</th>
                  <th className="p-4">Showroom Space</th>
                  <th className="p-4">Salary Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-950">
                <tr className="hover:bg-zinc-50/50">
                  <td className="p-4 font-bold text-zinc-900">District</td>
                  <td className="p-4">₹26 Lakhs</td>
                  <td className="p-4">1000 sq.ft.</td>
                  <td className="p-4">Provided by Company</td>
                </tr>
                <tr className="hover:bg-zinc-50/50">
                  <td className="p-4 font-bold text-zinc-900">Tehsil</td>
                  <td className="p-4">₹13 Lakhs</td>
                  <td className="p-4">500 sq.ft.</td>
                  <td className="p-4">Provided by Company</td>
                </tr>
                <tr className="hover:bg-zinc-50/50">
                  <td className="p-4 font-bold text-zinc-900">Rural</td>
                  <td className="p-4">₹6.25 Lakhs</td>
                  <td className="p-4">300 sq.ft.</td>
                  <td className="p-4">Provided by Company</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Manpower & Brand Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h5 className="font-bold text-zinc-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FiUsers className="text-purple-600" /> Manpower Requirement
            </h5>
            <ul className="space-y-2 text-sm text-zinc-700 font-light pl-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <span><strong>Mechanic:</strong> 1 (to be trained/certified by our company)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <span><strong>Salesman:</strong> 1 (to be trained/certified by our company)</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-zinc-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FiSettings className="text-purple-600" /> Brand & Promotion
            </h5>
            <ul className="space-y-2 text-sm text-zinc-700 font-light pl-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                <span>As per Terms & Conditions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                <span>After market survey of the desired location as mutually discussed.</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-zinc-400 text-xs italic border-t border-zinc-100 pt-4 mt-6">
          * If you can fulfill the above-mentioned criteria then please submit the dealership form below. We will get back to you soon.
        </p>
      </div>

      {/* Benefits list & CTA */}
      <div className="bg-white border border-zinc-200/60 rounded-3xl p-8 md:p-12 shadow-sm text-left flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold text-zinc-900 font-display mb-6">
            Dealer Benefits & Brand Support
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500 shrink-0" size={18} />
                <span className="text-zinc-700 text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 w-full lg:w-auto">
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full lg:w-auto inline-flex items-center justify-center bg-gradient-to-r from-zinc-950 to-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:scale-[1.03] text-white font-bold py-4 px-10 rounded-2xl text-sm transition-all duration-300 cursor-pointer"
          >
            Apply For Dealership
          </button>
        </div>
      </div>

      {/* Inquiry Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <DealerInquiryForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
