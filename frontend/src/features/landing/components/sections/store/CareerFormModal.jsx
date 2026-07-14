import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiChevronRight, FiChevronLeft, FiUpload, FiFileText, FiAward } from 'react-icons/fi';

const INDIAN_STATES_FALLBACK = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", 
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

import { useCMSCareersCopy } from '../../../cms/hooks/useCMSCopy';

export default function CareerFormModal({ isOpen, onClose }) {
  const careers = useCMSCareersCopy();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Section 1: Personal Details
    fullName: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    gender: 'Male',
    dob: '',
    currentCity: '',
    state: 'Maharashtra',
    fullAddress: '',
    // Section 2: Job Details
    position: 'Sales Executive',
    preferredWorkArea: [],
    preferredLocation: '',
    readyForFieldSales: 'Yes',
    hasTwoWheeler: 'Yes',
    hasDrivingLicense: 'Yes',
    // Section 3: Experience Details
    qualification: 'Graduate',
    experienceYears: 'Fresher',
    previousCompany: '',
    salary: '',
    reasonToJoin: '',
    // Section 4: Documents
    resumeName: '',
    aadhaarPanName: '',
    passportPhotoName: '',
    offerLetterName: '',
    salarySlipName: '',
    // Section 5: Declaration
    isDeclared: false,
    // Payment Section
    feeStatus: 'Pending',
    paymentScreenshotName: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    if (e.target.name === 'email') {
      setIsEmailVerified(false);
      setOtpSent(false);
      setGeneratedOtp('');
      setUserOtp('');
      setOtpError('');
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const current = prev.preferredWorkArea;
      if (checked) {
        return { ...prev, preferredWorkArea: [...current, value] };
      } else {
        return { ...prev, preferredWorkArea: current.filter(item => item !== value) };
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [e.target.name + 'Name']: file.name
      }));
    }
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.fullName || !formData.mobileNumber || !formData.email || !formData.dob || !formData.currentCity || !formData.fullAddress) {
        setError('Please fill in all personal details.');
        return false;
      }
      if (!isEmailVerified) {
        setError('Please verify your email address via OTP before proceeding.');
        return false;
      }
    } else if (step === 2) {
      if (formData.preferredWorkArea.length === 0 || !formData.preferredLocation) {
        setError('Please select preferred work areas and preferred working location.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.reasonToJoin) {
        setError(`Please explain why you want to join ${careers.companyName}.`);
        return false;
      }
    } else if (step === 4) {
      if (!formData.resumeName || !formData.aadhaarPanName || !formData.passportPhotoName) {
        setError('Please upload all required files (Resume, Aadhaar/PAN, Passport Photo).');
        return false;
      }
    } else if (step === 5) {
      if (!formData.isDeclared) {
        setError('You must accept the declaration before submitting.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const stored = localStorage.getItem("powersafe_job_applications");
      const applications = stored ? JSON.parse(stored) : [];
      const newApp = {
        ...formData,
        id: "app_" + Date.now(),
        submittedAt: new Date().toISOString()
      };
      applications.push(newApp);
      localStorage.setItem("powersafe_job_applications", JSON.stringify(applications));
    } catch (err) {
      console.error("Failed to save job application", err);
    }

    setIsSubmitted(true);
    setError('');
  };

  const stepsList = [
    "Personal Details",
    "Job Details",
    "Experience",
    "Documents",
    "Declaration & Payment"
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-zinc-950 text-white p-6 relative border-b border-zinc-800 shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full cursor-pointer transition-colors z-10"
          >
            <FiX size={18} />
          </button>
          <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase block mb-1">
            {careers.headerTitle || 'POWER SAFE INDUSTRIES PVT. LTD.'}
          </span>
          <h3 className="text-xl md:text-2xl font-black font-display text-left">
            PAN India Recruitment 2026
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-1 text-left">
            EV & Electronics Sales Division hiring drive. Complete the form carefully.
          </p>
        </div>

        {/* Multi-Step Stepper Header Indicator */}
        {!isSubmitted && (
          <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 shrink-0 hidden sm:flex justify-between items-center gap-2">
            {stepsList.map((stepName, index) => {
              const stepNum = index + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div key={index} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                    isActive ? "bg-amber-500 border-amber-500 text-white" :
                    isCompleted ? "bg-zinc-900 border-zinc-900 text-white" :
                    "bg-white border-zinc-300 text-zinc-500"
                  }`}>
                    {isCompleted ? "✓" : stepNum}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                    isActive ? "text-amber-500" :
                    isCompleted ? "text-zinc-800" :
                    "text-zinc-400"
                  }`}>
                    {stepName.split(" ")[0]}
                  </span>
                  {index < stepsList.length - 1 && (
                    <div className="h-[2px] bg-zinc-200 flex-1 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Form Content Body (Scrollable) */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold p-3.5 rounded-r-xl mb-6 text-left">
              {error}
            </div>
          )}

          {isSubmitted ? (
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500">
                <FiCheckCircle size={44} />
              </div>
              <h3 className="text-3xl font-black text-zinc-950 font-display mb-2">✅ Thank You For Applying!</h3>
              <p className="text-zinc-600 font-medium text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Our HR team will contact shortlisted candidates shortly.<br />
                <span className="font-bold text-zinc-900 block mt-3">{careers.companyName} Pvt. Ltd.</span>
                <span className="text-xs text-zinc-500 block">EV & Electronics Division • PAN India Recruitment Drive</span>
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setStep(1);
                  setFormData({
                    fullName: '',
                    mobileNumber: '',
                    whatsappNumber: '',
                    email: '',
                    gender: 'Male',
                    dob: '',
                    currentCity: '',
                    state: 'Maharashtra',
                    fullAddress: '',
                    position: 'Sales Executive',
                    preferredWorkArea: [],
                    preferredLocation: '',
                    readyForFieldSales: 'Yes',
                    hasTwoWheeler: 'Yes',
                    hasDrivingLicense: 'Yes',
                    qualification: 'Graduate',
                    experienceYears: 'Fresher',
                    previousCompany: '',
                    salary: '',
                    reasonToJoin: '',
                    resumeName: '',
                    aadhaarPanName: '',
                    passportPhotoName: '',
                    offerLetterName: '',
                    salarySlipName: '',
                    isDeclared: false,
                    feeStatus: 'Pending',
                    paymentScreenshotName: ''
                  });
                  setIsEmailVerified(false);
                  setOtpSent(false);
                  setGeneratedOtp('');
                  setUserOtp('');
                  setOtpError('');
                  onClose();
                }}
                className="bg-zinc-950 hover:bg-zinc-900 text-white font-bold py-3.5 px-10 rounded-full text-xs uppercase tracking-widest transition-all duration-300 border-2 border-zinc-950 cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              
              {/* STEP 1: PERSONAL DETAILS */}
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-950 border-b border-zinc-200 pb-2 uppercase tracking-wider">
                    SECTION 1 — PERSONAL DETAILS
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="Enter full name"
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        required
                        placeholder="10-digit mobile number"
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">WhatsApp Number *</label>
                      <input
                        type="tel"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        required
                        placeholder="WhatsApp number"
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        required
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Email Address *</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={isEmailVerified}
                          required
                          placeholder="name@email.com"
                          className={`w-full bg-zinc-50 border-2 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors ${
                            isEmailVerified ? "border-emerald-500 bg-emerald-50/30" : "border-zinc-200"
                          }`}
                        />
                      </div>
                      {isEmailVerified && (
                        <div className="text-emerald-600 font-bold text-xs mt-1 flex items-center gap-1">
                          Verified ✓
                        </div>
                      )}

                      {/* Verification Area */}
                      {formData.email && !isEmailVerified && (
                        <div className="mt-2 text-left">
                          {!otpSent ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!formData.email.includes('@')) {
                                  setOtpError('Please enter a valid email address.');
                                  return;
                                }
                                setVerificationLoading(true);
                                setOtpError('');
                                setTimeout(() => {
                                  const mockOtp = "123456";
                                  setGeneratedOtp(mockOtp);
                                  setOtpSent(true);
                                  setVerificationLoading(false);
                                }, 800);
                              }}
                              disabled={verificationLoading}
                              className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                            >
                              {verificationLoading ? 'Sending...' : 'Verify Email (Send OTP)'}
                            </button>
                          ) : (
                            <div className="space-y-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Enter OTP"
                                  value={userOtp}
                                  onChange={(e) => setUserOtp(e.target.value)}
                                  className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black placeholder:text-zinc-500 focus:outline-none focus:border-zinc-950"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (userOtp === generatedOtp) {
                                      setIsEmailVerified(true);
                                      setOtpSent(false);
                                      setOtpError('');
                                    } else {
                                      setOtpError('Invalid OTP code.');
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                                >
                                  Verify
                                </button>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const mockOtp = "123456";
                                    setGeneratedOtp(mockOtp);
                                    setUserOtp('');
                                    setOtpError('');
                                  }}
                                  className="text-amber-600 hover:underline cursor-pointer"
                                >
                                  Resend
                                </button>
                                <span className="text-zinc-950 font-bold font-mono">OTP: {generatedOtp}</span>
                              </div>
                            </div>
                          )}
                          {otpError && (
                            <span className="text-[10px] font-bold text-red-600 block mt-1">{otpError}</span>
                          )}
                        </div>
                      )}

                      {isEmailVerified && (
                        <div className="mt-1.5 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEmailVerified(false);
                              setOtpSent(false);
                              setGeneratedOtp('');
                              setUserOtp('');
                              setOtpError('');
                            }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                          >
                            Change Email
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Current City *</label>
                      <input
                        type="text"
                        name="currentCity"
                        value={formData.currentCity}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Mumbai"
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">State *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      >
                        {(careers.states?.length ? careers.states : INDIAN_STATES_FALLBACK).map((st, i) => (
                          <option key={i} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Full Address *</label>
                    <textarea
                      name="fullAddress"
                      value={formData.fullAddress}
                      onChange={handleChange}
                      required
                      rows="3"
                      placeholder="Enter full residential address..."
                      className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: JOB DETAILS */}
              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-950 border-b border-zinc-200 pb-2 uppercase tracking-wider">
                    SECTION 2 — JOB DETAILS
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-2">Position Applying For *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Sales Executive', 'Sales Manager', 'City Head'].map((pos) => (
                        <label 
                          key={pos}
                          className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            formData.position === pos ? "border-zinc-950 bg-zinc-50 font-bold" : "border-zinc-200 bg-white"
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="position" 
                            value={pos} 
                            checked={formData.position === pos}
                            onChange={handleChange}
                            className="sr-only" 
                          />
                          <span className="text-xs text-zinc-800">{pos}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-2">Preferred Work Area (Select multiple if applicable) *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['EV Sales', 'Electronics Sales', 'Electrical Products', 'Dealer Development', 'Channel Sales'].map((area) => (
                        <label 
                          key={area}
                          className={`border-2 rounded-xl p-3 flex items-center gap-2 cursor-pointer transition-all ${
                            formData.preferredWorkArea.includes(area) ? "border-zinc-950 bg-zinc-50 font-bold" : "border-zinc-200 bg-white"
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            value={area} 
                            checked={formData.preferredWorkArea.includes(area)}
                            onChange={handleCheckboxChange}
                            className="rounded text-zinc-950 focus:ring-0" 
                          />
                          <span className="text-xs text-zinc-800">{area}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Preferred Working Location *</label>
                    <input
                      type="text"
                      name="preferredLocation"
                      value={formData.preferredLocation}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Pune City, Bangalore South"
                      className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Ready For Field Sales? *</label>
                      <select
                        name="readyForFieldSales"
                        value={formData.readyForFieldSales}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Do You Have Two Wheeler? *</label>
                      <select
                        name="hasTwoWheeler"
                        value={formData.hasTwoWheeler}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Driving License Available? *</label>
                      <select
                        name="hasDrivingLicense"
                        value={formData.hasDrivingLicense}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: EXPERIENCE DETAILS */}
              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-950 border-b border-zinc-200 pb-2 uppercase tracking-wider">
                    SECTION 3 — EXPERIENCE DETAILS
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Highest Qualification *</label>
                      <select
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      >
                        <option value="10th">10th</option>
                        <option value="12th">12th</option>
                        <option value="Graduate">Graduate</option>
                        <option value="Post Graduate">Post Graduate</option>
                        <option value="MBA">MBA</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Total Sales Experience *</label>
                      <select
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      >
                        <option value="Fresher">Fresher</option>
                        <option value="0-1 Year">0-1 Year</option>
                        <option value="1-3 Years">1-3 Years</option>
                        <option value="3-5 Years">3-5 Years</option>
                        <option value="5+ Years">5+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Previous Company Name (Optional)</label>
                      <input
                        type="text"
                        name="previousCompany"
                        value={formData.previousCompany}
                        onChange={handleChange}
                        placeholder="Previous employer name"
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Current/Last Salary (Optional)</label>
                      <input
                        type="text"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        placeholder="e.g. ₹25,000 / month"
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Why Do You Want To Join Power Safe Industries? *</label>
                    <textarea
                      name="reasonToJoin"
                      value={formData.reasonToJoin}
                      onChange={handleChange}
                      required
                      rows="4"
                      placeholder="Briefly tell us why you are interested in this position..."
                      className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: DOCUMENTS UPLOAD */}
              {step === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-950 border-b border-zinc-200 pb-2 uppercase tracking-wider">
                    SECTION 4 — DOCUMENTS
                  </h4>

                  <div className="space-y-4">
                    {/* Resume Upload */}
                    <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-zinc-50 hover:bg-zinc-100 transition-colors relative">
                      <input 
                        type="file" 
                        name="resume" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FiUpload className="text-zinc-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-zinc-800">Upload Resume *</span>
                      <span className="text-[10px] text-zinc-400 mt-1">PDF, DOCX formats</span>
                      {formData.resumeName && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          <FiFileText size={14} />
                          {formData.resumeName}
                        </div>
                      )}
                    </div>

                    {/* Offer Letter Upload */}
                    <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-zinc-50 hover:bg-zinc-100 transition-colors relative">
                      <input 
                        type="file" 
                        name="offerLetter" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FiUpload className="text-zinc-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-zinc-800">Upload Offer Letter <span className="text-zinc-400 font-normal">(Optional)</span></span>
                      <span className="text-[10px] text-zinc-400 mt-1">PDF, JPG, PNG formats</span>
                      {formData.offerLetterName && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          <FiFileText size={14} />
                          {formData.offerLetterName}
                        </div>
                      )}
                    </div>

                    {/* Salary Slip Upload */}
                    <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-zinc-50 hover:bg-zinc-100 transition-colors relative">
                      <input 
                        type="file" 
                        name="salarySlip" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FiUpload className="text-zinc-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-zinc-800">Upload Salary Slip <span className="text-zinc-400 font-normal">(Optional)</span></span>
                      <span className="text-[10px] text-zinc-400 mt-1">PDF, JPG, PNG formats</span>
                      {formData.salarySlipName && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          <FiFileText size={14} />
                          {formData.salarySlipName}
                        </div>
                      )}
                    </div>
                    {/* Aadhaar/PAN Upload */}
                    <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-zinc-50 hover:bg-zinc-100 transition-colors relative">
                      <input 
                        type="file" 
                        name="aadhaarPan" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FiUpload className="text-zinc-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-zinc-800">Upload Aadhaar/PAN *</span>
                      <span className="text-[10px] text-zinc-400 mt-1">PDF, JPG, PNG formats</span>
                      {formData.aadhaarPanName && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          <FiFileText size={14} />
                          {formData.aadhaarPanName}
                        </div>
                      )}
                    </div>

                    {/* Passport Photo Upload */}
                    <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-zinc-50 hover:bg-zinc-100 transition-colors relative">
                      <input 
                        type="file" 
                        name="passportPhoto" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FiUpload className="text-zinc-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-zinc-800">Upload Passport Photo *</span>
                      <span className="text-[10px] text-zinc-400 mt-1">JPG, PNG formats</span>
                      {formData.passportPhotoName && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          <FiFileText size={14} />
                          {formData.passportPhotoName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: DECLARATION & PAYMENT */}
              {step === 5 && (
                <div className="space-y-6">
                  {/* Declaration Block */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-zinc-950 border-b border-zinc-200 pb-2 uppercase tracking-wider">
                      SECTION 5 — DECLARATION
                    </h4>
                    <label className="flex items-start gap-3 border-2 border-zinc-250 p-4 rounded-2xl cursor-pointer bg-zinc-50">
                      <input
                        type="checkbox"
                        name="isDeclared"
                        checked={formData.isDeclared}
                        onChange={(e) => setFormData({ ...formData, isDeclared: e.target.checked })}
                        className="mt-1 rounded text-zinc-950 focus:ring-0"
                      />
                      <span className="text-xs font-semibold leading-relaxed text-zinc-800">
                        “I confirm that all details provided by me are correct.”
                      </span>
                    </label>
                  </div>

                  {/* Payment Block */}
                  <div className="border-2 border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-950 text-white p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FiAward className="text-amber-500" size={24} />
                        <div className="text-left">
                          <h5 className="text-sm font-black uppercase tracking-wider">Registration & Onboarding Fee</h5>
                          <p className="text-[10px] text-zinc-400">EV & Electronics Division Priority Interview</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-amber-500">{careers.applicationFee}</span>
                    </div>

                    <div className="p-5 bg-white space-y-4">
                      <div className="text-xs text-zinc-650 space-y-2 text-left">
                        <p className="font-bold text-zinc-800">Includes:</p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                          <li>Candidate Profile Verification</li>
                          <li>Product & EV Training Materials</li>
                          <li>Sales Onboarding Certification</li>
                          <li>Priority Shortlisting & Interview slot</li>
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Registration Fee Status</label>
                          <select
                            name="feeStatus"
                            value={formData.feeStatus}
                            onChange={handleChange}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 transition-colors"
                          >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>

                        {formData.feeStatus === "Paid" && (
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">Payment Screenshot</label>
                            <div className="border border-zinc-200 bg-zinc-50 px-4 py-2.5 rounded-xl text-xs relative flex items-center justify-center cursor-pointer">
                              <input 
                                type="file" 
                                name="paymentScreenshot" 
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <span className="truncate text-zinc-600 font-semibold">
                                {formData.paymentScreenshotName || "Upload Screenshot"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center gap-1 bg-white border-2 border-zinc-200 hover:border-zinc-300 text-zinc-700 font-bold py-2.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <FiChevronLeft size={16} />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center gap-1 bg-zinc-950 hover:bg-zinc-900 text-white font-bold py-2.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer border-2 border-zinc-950"
                  >
                    Next
                    <FiChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black py-3 px-8 rounded-full text-xs uppercase tracking-widest transition-all cursor-pointer border-2 border-zinc-950 shadow-md"
                  >
                    Submit Application
                  </button>
                )}
              </div>

            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
