import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLock, FiEdit, FiTrash2, FiSave, FiList, FiTrendingUp, FiPlusCircle, FiFileText } from 'react-icons/fi';
import { getStoreConfig, saveStoreConfig, getDealerInquiries } from '../../../data/storeConfig';

export default function StoreAdminPanel({ isOpen, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('brand'); // brand, warranty, dealership, images, inquiries
  
  const [config, setConfig] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getStoreConfig());
      setInquiries(getDealerInquiries());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'haion123' || password === 'admin') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid password. Try "haion123"');
    }
  };

  const handleSave = () => {
    saveStoreConfig(config);
    alert('Store Configuration Saved Successfully!');
  };

  // Helper to update deeply nested states
  const updateConfigField = (section, field, value) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
  };

  const addExclusion = () => {
    const list = [...config.warrantyTerms.exclusions, "New Exclusion Item"];
    updateConfigField("warrantyTerms", "exclusions", list);
  };

  const removeExclusion = (index) => {
    const list = config.warrantyTerms.exclusions.filter((_, idx) => idx !== index);
    updateConfigField("warrantyTerms", "exclusions", list);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage = {
        id: "img_" + Date.now(),
        src: reader.result,
        title: "Uploaded Showroom Outlet",
        location: "Authorized Location"
      };
      const list = [...config.showroomInfo.images, newImage];
      updateConfigField("showroomInfo", "images", list);
    };
    reader.readAsDataURL(file);
  };

  const removeShowroomImage = (id) => {
    const list = config.showroomInfo.images.filter(img => img.id !== id);
    updateConfigField("showroomInfo", "images", list);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-5xl w-full h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <h3 className="text-2xl font-bold text-zinc-900 font-display flex items-center gap-2">
            <FiLock className="text-purple-600" />
            Storefront Admin Control Panel
          </h3>
          <button 
            onClick={onClose}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-2 rounded-full cursor-pointer transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {!isAuthenticated ? (
          /* Authentication Form */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <FiLock size={32} />
            </div>
            <h4 className="text-xl font-bold text-zinc-900 mb-2">Admin Authentication</h4>
            <p className="text-zinc-500 text-xs font-light mb-6">
              Enter password to access dealership requests and content management options. (Hint: <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono font-bold text-purple-600">haion123</code>)
            </p>
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 focus:outline-none focus:border-purple-500 text-center text-sm font-semibold"
                autoFocus
              />
              {loginError && <p className="text-xs text-red-500 font-semibold">{loginError}</p>}
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-zinc-950 to-amber-500 text-white font-bold py-3 rounded-xl text-sm transition-all duration-300 cursor-pointer"
              >
                Authenticate
              </button>
            </form>
          </div>
        ) : (
          /* Admin Dashboard Dashboard */
          config && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-full md:w-64 border-r border-zinc-100 bg-zinc-50/50 p-4 space-y-2 shrink-0 overflow-y-auto">
                <button 
                  onClick={() => setActiveTab('brand')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-left transition-colors cursor-pointer ${
                    activeTab === 'brand' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-650 hover:bg-zinc-100'
                  }`}
                >
                  <FiTrendingUp /> Brand Content
                </button>
                <button 
                  onClick={() => setActiveTab('warranty')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-left transition-colors cursor-pointer ${
                    activeTab === 'warranty' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-650 hover:bg-zinc-100'
                  }`}
                >
                  <FiFileText /> Warranty Info
                </button>
                <button 
                  onClick={() => setActiveTab('dealership')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-left transition-colors cursor-pointer ${
                    activeTab === 'dealership' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-650 hover:bg-zinc-100'
                  }`}
                >
                  <FiList /> Dealer Plans
                </button>
                <button 
                  onClick={() => setActiveTab('images')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-left transition-colors cursor-pointer ${
                    activeTab === 'images' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-650 hover:bg-zinc-100'
                  }`}
                >
                  <FiPlusCircle /> Showroom Gallery
                </button>
                <div className="h-[1px] bg-zinc-200 my-4" />
                <button 
                  onClick={() => {
                    setActiveTab('inquiries');
                    setInquiries(getDealerInquiries());
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-left transition-colors cursor-pointer ${
                    activeTab === 'inquiries' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-650 hover:bg-zinc-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><FiList /> Dealer Inquiries</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'inquiries' ? 'bg-white text-purple-600' : 'bg-purple-500/10 text-purple-600'}`}>
                    {inquiries.length}
                  </span>
                </button>
              </div>

              {/* Main Content Pane */}
              <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col justify-between text-left">
                <div className="space-y-6">
                  
                  {/* TAB 1: Brand Content */}
                  {activeTab === 'brand' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-zinc-950 font-display">Manage Brand Showcase</h4>
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Heading</label>
                        <input 
                          type="text"
                          value={config.brandContent.heading}
                          onChange={(e) => updateConfigField("brandContent", "heading", e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-800 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Description</label>
                        <textarea 
                          value={config.brandContent.description}
                          onChange={(e) => updateConfigField("brandContent", "description", e.target.value)}
                          rows="4"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-800 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Warranty Info */}
                  {activeTab === 'warranty' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-zinc-950 font-display">Manage Warranty Protection</h4>
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Heading</label>
                        <input 
                          type="text"
                          value={config.warrantyInfo.heading}
                          onChange={(e) => updateConfigField("warrantyInfo", "heading", e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-800 text-sm focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {config.warrantyInfo.cards.map((card, idx) => (
                          <div key={card.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                            <span className="font-bold text-zinc-900 text-xs uppercase block mb-2">{card.title} Details</span>
                            <input 
                              type="text"
                              value={card.duration}
                              onChange={(e) => {
                                const list = [...config.warrantyInfo.cards];
                                list[idx].duration = e.target.value;
                                updateConfigField("warrantyInfo", "cards", list);
                              }}
                              placeholder="Duration e.g. 1 Year Warranty"
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-800 text-xs mb-2"
                            />
                            <input 
                              type="text"
                              value={card.coverage}
                              onChange={(e) => {
                                const list = [...config.warrantyInfo.cards];
                                list[idx].coverage = e.target.value;
                                updateConfigField("warrantyInfo", "cards", list);
                              }}
                              placeholder="Coverage e.g. Repair or Replacement"
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-800 text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-zinc-100">
                        <span className="font-bold text-zinc-900 text-sm block mb-2">Exclusion List (Terms & Conditions)</span>
                        <div className="space-y-2">
                          {config.warrantyTerms.exclusions.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const list = [...config.warrantyTerms.exclusions];
                                  list[idx] = e.target.value;
                                  updateConfigField("warrantyTerms", "exclusions", list);
                                }}
                                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-800 text-xs"
                              />
                              <button 
                                onClick={() => removeExclusion(idx)}
                                className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={addExclusion}
                          className="mt-2 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                        >
                          + Add Exclusion Item
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Dealer Plans */}
                  {activeTab === 'dealership' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-zinc-950 font-display">Manage Dealership Investment & Benefits</h4>
                      <div className="space-y-4">
                        {config.dealerInfo.plans.map((plan, idx) => (
                          <div key={plan.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                            <span className="font-bold text-zinc-900 text-sm block mb-2">{plan.level} Setup</span>
                            <div className="grid grid-cols-2 gap-4">
                              <input 
                                type="text"
                                value={plan.investment}
                                onChange={(e) => {
                                  const list = [...config.dealerInfo.plans];
                                  list[idx].investment = e.target.value;
                                  updateConfigField("dealerInfo", "plans", list);
                                }}
                                className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-800 text-xs"
                              />
                              <input 
                                type="text"
                                value={plan.requirement}
                                onChange={(e) => {
                                  const list = [...config.dealerInfo.plans];
                                  list[idx].requirement = e.target.value;
                                  updateConfigField("dealerInfo", "plans", list);
                                }}
                                className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-800 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Showroom Images */}
                  {activeTab === 'images' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-zinc-950 font-display">Manage Showroom Images</h4>
                        <label className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors">
                          <FiPlusCircle /> Upload Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {config.showroomInfo.images.map((img) => (
                          <div key={img.id} className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-square">
                            <img 
                              src={img.src} 
                              alt="Showroom" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                              <button 
                                onClick={() => removeShowroomImage(img.id)}
                                className="self-end bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors cursor-pointer"
                              >
                                <FiTrash2 size={14} />
                              </button>
                              <div>
                                <input 
                                  type="text" 
                                  value={img.title}
                                  onChange={(e) => {
                                    const list = config.showroomInfo.images.map(i => i.id === img.id ? { ...i, title: e.target.value } : i);
                                    updateConfigField("showroomInfo", "images", list);
                                  }}
                                  className="w-full bg-black/40 border-none rounded text-white text-[10px] px-1 focus:outline-none"
                                />
                                <input 
                                  type="text" 
                                  value={img.location}
                                  onChange={(e) => {
                                    const list = config.showroomInfo.images.map(i => i.id === img.id ? { ...i, location: e.target.value } : i);
                                    updateConfigField("showroomInfo", "images", list);
                                  }}
                                  className="w-full bg-black/40 border-none rounded text-zinc-300 text-[9px] px-1 focus:outline-none mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Inquiries list */}
                  {activeTab === 'inquiries' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-zinc-950 font-display">Dealership Applications ({inquiries.length})</h4>
                      {inquiries.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 text-sm">
                          No dealership inquiries received yet.
                        </div>
                      ) : (
                        <div className="border border-zinc-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
                                <th className="p-3">Applicant</th>
                                <th className="p-3">Contact</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Investment</th>
                                <th className="p-3">Date</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inquiries.map((inq) => (
                                <tr key={inq.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                                  <td className="p-3 font-semibold text-zinc-800">{inq.fullName}</td>
                                  <td className="p-3 text-zinc-600">
                                    <div>{inq.mobileNumber}</div>
                                    <div className="text-[10px] text-zinc-400">{inq.email}</div>
                                  </td>
                                  <td className="p-3 text-zinc-600">{inq.city}, {inq.state}</td>
                                  <td className="p-3 text-zinc-800 font-semibold">{inq.availableInvestment || 'N/A'}</td>
                                  <td className="p-3 text-zinc-400 text-[10px]">{new Date(inq.submittedAt).toLocaleDateString()}</td>
                                  <td className="p-3 text-right">
                                    <button 
                                      onClick={() => setSelectedInquiry(inq)}
                                      className="bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Save Buttons (Not displayed in inquiries tab) */}
                {activeTab !== 'inquiries' && (
                  <div className="mt-8 pt-4 border-t border-zinc-100 flex justify-end gap-3">
                    <button 
                      onClick={handleSave}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FiSave /> Save Configuration
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </motion.div>

      {/* Inquiry Detail Sub-Modal */}
      <AnimatePresence>
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl relative text-left"
            >
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="absolute top-4 right-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-2 rounded-full cursor-pointer transition-colors"
              >
                <FiX size={16} />
              </button>
              <h4 className="text-xl font-bold text-zinc-900 font-display mb-4">Application Details</h4>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-zinc-400 block uppercase">Applicant Name</span>
                  <p className="text-zinc-800 font-semibold">{selectedInquiry.fullName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block uppercase">Mobile</span>
                    <p className="text-zinc-800">{selectedInquiry.mobileNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block uppercase">Email</span>
                    <p className="text-zinc-800">{selectedInquiry.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block uppercase">City & State</span>
                    <p className="text-zinc-800">{selectedInquiry.city}, {selectedInquiry.state}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block uppercase">Investment</span>
                    <p className="text-zinc-800 font-semibold">{selectedInquiry.availableInvestment || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block uppercase">Showroom Space</span>
                    <p className="text-zinc-800">{selectedInquiry.showroomArea || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block uppercase">Business Experience</span>
                    <p className="text-zinc-800">{selectedInquiry.businessExperience || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-400 block uppercase">Applicant Message</span>
                  <p className="text-zinc-600 bg-zinc-50 border border-zinc-100 p-3 rounded-lg text-xs leading-relaxed font-light">
                    {selectedInquiry.message || 'No additional message provided.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
