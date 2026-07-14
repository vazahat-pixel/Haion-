import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiChevronsRight, FiAlertCircle } from 'react-icons/fi';

export default function WarrantySection({ info, terms }) {
  return (
    <section className="mb-20">
      {/* SECTION 3 - Warranty Coverage */}
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gradient text-center font-display mb-6 tracking-tight">
          {info.heading}
        </h2>
        <p className="text-zinc-500 text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto">
          {info.description}
        </p>
      </div>

      {/* OFFICIAL WARRANTY CLAUSE DOCUMENT SHEET */}
      <div className="max-w-7xl mx-auto bg-white border border-zinc-200/60 rounded-3xl p-8 md:p-12 shadow-sm text-left mb-12">
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

        <div className="space-y-4 text-zinc-900 text-sm font-semibold mb-6">
          <p>TO,</p>
          <p className="pl-4">THE DEALER OF Powersafe Industries Pvt Ltd.</p>
          <p className="font-bold text-zinc-950">SUB: REGARDING WARRANTY CLAUSE</p>
          <p>DEAR SIR,</p>
        </div>

        <p className="text-zinc-950 text-sm font-medium leading-relaxed mb-8 uppercase text-justify">
          WE AT Powersafe Industries Pvt Ltd. WELCOME YOU TO THE BYBY FAMILY. TOGETHER WE WORK TO PROVIDE BEST OF QUALITY & SERVICES TO OUR CUSTOMERS. WE ARE HAVING A VERY CUSTOMER FRIENDLY WARRANTY POLICY ON THE MOST CRITICAL PARTS OF THE E-SCOOTER. THE DETAILS ARE GIVEN BELOW: -
        </p>

        {/* Warranty Clause Table */}
        <div className="mb-8">
          <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-zinc-900 text-white font-bold font-display border-b border-zinc-200">
                  <th className="p-4">PARTS NAME</th>
                  <th className="p-4">WARRANTY CLAUSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-950">
                <tr className="hover:bg-zinc-50/50">
                  <td className="p-4 font-bold text-zinc-900">Battery</td>
                  <td className="p-4">Lithium Ion - 3 YEAR WARRANTY (REPAIR OR REPLACEMENT)</td>
                </tr>
                <tr className="hover:bg-zinc-50/50">
                  <td className="p-4 font-bold text-zinc-900">MOTOR</td>
                  <td className="p-4">1 YEAR WARRANTY (REPAIR OR REPLACEMENT)</td>
                </tr>
                <tr className="hover:bg-zinc-50/50">
                  <td className="p-4 font-bold text-zinc-900">CHARGER</td>
                  <td className="p-4">1 YEAR WARRANTY (REPAIR OR REPLACEMENT)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 4 - Warranty Terms & Official Note Details */}
      <div className="max-w-7xl mx-auto">
        <div className="border border-zinc-200/60 rounded-3xl bg-white shadow-sm p-8 md:p-12 text-left space-y-6">
          {/* Document Header */}
          <div className="border-b border-zinc-100 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

          <h4 className="flex items-center gap-2 font-display font-bold text-xl text-zinc-950 border-b border-zinc-100 pb-4">
            <FiShield className="text-purple-600" />
            Warranty Terms & Conditions (NOTE)
          </h4>

          {/* Detailed Terms List */}
          <div className="space-y-4">
            <span className="font-bold text-zinc-900 text-sm uppercase tracking-wider block">NOTE:</span>
            <ul className="space-y-3 pl-2">
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Dealers need to keep ready stock of essential spare parts in sufficient quantity so that customers get sales, service, and spares.</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Dealers need to purchase & maintain minimum stock of spares worth As per Policy.</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Dealers should keep trained mechanic to give service support to the e-scooter driver from their respective showrooms.</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Warranty is not onsite. Cost of transit of such parts (claimed) won't be borne by the company.</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Warranty does not cover physical damage, damage occurring from negligent use.</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Warranty does not cover accidents or problems due to overloading.</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Warranty will be void if there is any unauthorized change/alteration in electricals.</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>It is dealer's responsibility to get the parts repaired or replaced (if non-repairable) from the manufacturer within warranty period (if the claims are proved authentic).</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-950 text-sm font-medium leading-relaxed">
                <span className="text-purple-605 font-bold shrink-0 mt-0.5">➤</span>
                <span>Company policy may change anytime with prior notice.</span>
              </li>
            </ul>
          </div>

          {/* Footer Text */}
          <p className="text-xs md:text-sm text-zinc-950 font-bold border-t border-zinc-100 pt-6 mt-6 leading-relaxed">
            PLEASE ACCEPT & SIGN AND SEND THIS LETTER TO US AT THE EARLIEST. PLEASE KEEP A COPY OF THE SAME. THANK YOU FOR YOUR SUPPORT AND COMPLIANCE IN THIS MATTER.
          </p>

          {/* Signatures Fields */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-sm text-zinc-950 font-bold">
            <div className="space-y-4">
              <div>NAME: <span className="border-b border-zinc-300 inline-block w-40 h-5" /></div>
              <div>SIGNATURE: <span className="border-b border-zinc-300 inline-block w-40 h-5" /></div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <div>DATE: <span className="border-b border-zinc-300 inline-block w-40 h-5" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
