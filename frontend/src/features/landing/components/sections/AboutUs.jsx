import React, { useEffect } from 'react';
import { FiArrowLeft as ArrowIcon, FiX } from 'react-icons/fi';
import { useCMSAbout } from '../../cms/hooks/useCMSContent';

// Decorative Sticker Components matching the user's retro movie stickers collage
const TicketSticker = ({ className = "" }) => (
  <div className={`absolute select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] transform transition-transform duration-300 hover:scale-110 z-20 ${className}`}>
    <div className="bg-white p-1.5 rounded border border-zinc-300/80 rotate-[14deg]">
      <svg viewBox="0 0 120 70" className="w-28 h-16">
        {/* Outer border */}
        <rect x="2" y="2" width="116" height="66" rx="6" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        {/* Ticket content */}
        <rect x="6" y="6" width="108" height="58" rx="4" fill="#faf9f6" stroke="#18181b" strokeWidth="1.5" />
        {/* Side cutouts (notches) */}
        <path d="M 2 30 A 5 5 0 0 1 2 40" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <path d="M 118 30 A 5 5 0 0 0 118 40" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        {/* Dotted separators */}
        <line x1="24" y1="6" x2="24" y2="64" stroke="#18181b" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="96" y1="6" x2="96" y2="64" stroke="#18181b" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Ticket texts */}
        <text x="60" y="28" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="900" letterSpacing="1" textAnchor="middle" fill="#18181b">CINEMA</text>
        <text x="60" y="42" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="900" letterSpacing="2" textAnchor="middle" fill="#18181b">TICKET</text>
        <text x="60" y="55" fontSize="7" textAnchor="middle" fill="#18181b">★★★★★</text>
        {/* Ticket numbers */}
        <text x="14" y="38" fontFamily="monospace" fontSize="6" fontWeight="bold" textAnchor="middle" fill="#52525b" transform="rotate(-90, 14, 38)">057612</text>
        <text x="106" y="38" fontFamily="monospace" fontSize="6" fontWeight="bold" textAnchor="middle" fill="#52525b" transform="rotate(90, 106, 38)">057612</text>
      </svg>
    </div>
  </div>
);

const PopcornSticker = ({ className = "" }) => (
  <div className={`absolute select-none pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] transform transition-transform duration-300 hover:scale-110 z-20 ${className}`}>
    <div className="bg-white p-2 rounded-xl border border-zinc-350/80 -rotate-[12deg]">
      <svg viewBox="0 0 100 120" className="w-24 h-28">
        {/* Popcorn container */}
        <path d="M 22 45 L 30 112 L 70 112 L 78 45 Z" fill="#ffffff" stroke="#18181b" strokeWidth="3" />
        {/* Red & White Stripes */}
        <path d="M 31 45 L 38 112" stroke="#18181b" strokeWidth="2.5" />
        <path d="M 40 45 L 46 112" stroke="#18181b" strokeWidth="2.5" />
        <path d="M 50 45 L 50 112" stroke="#18181b" strokeWidth="2.5" />
        <path d="M 60 45 L 54 112" stroke="#18181b" strokeWidth="2.5" />
        <path d="M 69 45 L 62 112" stroke="#18181b" strokeWidth="2.5" />
        {/* Label badge */}
        <rect x="26" y="66" width="48" height="22" rx="4" fill="#18181b" />
        <text x="50" y="80" fontFamily="Impact, Arial Black, sans-serif" fontSize="9" fontWeight="900" letterSpacing="0.5" textAnchor="middle" fill="#ffffff">POPCORN</text>
        {/* Popcorn fluffy pieces on top */}
        <circle cx="50" cy="35" r="10" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <circle cx="38" cy="38" r="9" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <circle cx="62" cy="38" r="9" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <circle cx="28" cy="44" r="8" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <circle cx="72" cy="44" r="8" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <circle cx="48" cy="24" r="9" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <circle cx="58" cy="27" r="8" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        <circle cx="36" cy="28" r="7" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
      </svg>
    </div>
  </div>
);

const FilmCanisterSticker = ({ className = "" }) => (
  <div className={`absolute select-none pointer-events-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.12)] transform transition-transform duration-300 hover:scale-110 z-20 ${className}`}>
    <div className="bg-white p-1.5 rounded-lg border border-zinc-300/80 rotate-[8deg]">
      <svg viewBox="0 0 110 100" className="w-24 h-22">
        {/* Metal canister cylinder */}
        <rect x="42" y="15" width="46" height="70" rx="6" fill="#d4d4d8" stroke="#18181b" strokeWidth="2.5" />
        {/* Canister cap */}
        <ellipse cx="65" cy="15" rx="23" ry="5" fill="#27272a" stroke="#18181b" strokeWidth="2.5" />
        {/* Canister bottom cap */}
        <ellipse cx="65" cy="85" rx="23" ry="5" fill="#27272a" stroke="#18181b" strokeWidth="2.5" />
        {/* Label on canister */}
        <rect x="49" y="28" width="32" height="44" fill="#ffffff" stroke="#18181b" strokeWidth="1.5" />
        {/* Code stripes on label */}
        <line x1="55" y1="38" x2="75" y2="38" stroke="#18181b" strokeWidth="2.5" />
        <line x1="55" y1="48" x2="75" y2="48" stroke="#18181b" strokeWidth="2.5" />
        <line x1="55" y1="58" x2="70" y2="58" stroke="#18181b" strokeWidth="2.5" />
        {/* Film strip sticking out */}
        <path d="M 42 45 C 10 45, 12 75, 42 75" fill="none" stroke="#27272a" strokeWidth="16" strokeLinecap="round" />
        {/* Film holes */}
        <path d="M 38 41 C 12 41, 14 71, 38 71" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 3" />
        <path d="M 38 49 C 12 49, 14 79, 38 79" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 3" />
      </svg>
    </div>
  </div>
);

const CassetteSticker = ({ className = "" }) => (
  <div className={`absolute select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] transform transition-transform duration-300 hover:scale-110 z-20 ${className}`}>
    <div className="bg-white p-1.5 rounded-lg border border-zinc-300/80 -rotate-6">
      <svg viewBox="0 0 100 65" className="w-24 h-16">
        {/* Cassette outer shell */}
        <rect x="3" y="3" width="94" height="59" rx="6" fill="#27272a" stroke="#18181b" strokeWidth="2.5" />
        {/* Inner cassette label */}
        <rect x="12" y="10" width="76" height="34" rx="3" fill="#f4f4f5" stroke="#18181b" strokeWidth="1.5" />
        {/* Cassette window */}
        <rect x="25" y="18" width="50" height="18" rx="2" fill="#e4e4e7" stroke="#18181b" strokeWidth="1.5" />
        {/* Two spool holes */}
        <circle cx="38" cy="27" r="6" fill="#27272a" stroke="#18181b" strokeWidth="1.5" />
        <circle cx="62" cy="27" r="6" fill="#27272a" stroke="#18181b" strokeWidth="1.5" />
        {/* Spool teeth */}
        <path d="M 38 23 L 38 31 M 34 27 L 42 27" stroke="#faf9f6" strokeWidth="1" />
        <path d="M 62 23 L 62 31 M 58 27 L 66 27" stroke="#faf9f6" strokeWidth="1" />
        {/* Cassette label text */}
        <text x="50" y="40" fontFamily="monospace" fontSize="4" fontWeight="bold" textAnchor="middle" fill="#71717a">HI-FI TAPE</text>
      </svg>
    </div>
  </div>
);

const MusicNotesSticker = ({ className = "" }) => (
  <div className={`absolute select-none pointer-events-none drop-shadow-md transform transition-transform duration-300 hover:scale-110 z-20 ${className}`}>
    <div className="bg-white p-2 rounded-full border border-zinc-300/80 rotate-[15deg] flex items-center justify-center">
      <svg viewBox="0 0 50 50" className="w-10 h-10">
        {/* Double Eighth Note */}
        <path d="M 12 36 A 4 3 0 1 1 8 33" fill="#18181b" stroke="#18181b" strokeWidth="1.5" />
        <path d="M 32 32 A 4 3 0 1 1 28 29" fill="#18181b" stroke="#18181b" strokeWidth="1.5" />
        <path d="M 12 33 L 12 12 L 32 8 L 32 29" fill="none" stroke="#18181b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 12 12 L 32 8" fill="none" stroke="#18181b" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

const HeadphonesSticker = ({ className = "" }) => (
  <div className={`absolute select-none pointer-events-none drop-shadow-lg transform transition-transform duration-300 hover:scale-110 z-20 ${className}`}>
    <div className="bg-white p-2 rounded-xl border border-zinc-350/80 rotate-[10deg]">
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        {/* Headband */}
        <path d="M 15 55 A 35 35 0 0 1 85 55" fill="none" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
        <path d="M 15 55 A 35 35 0 0 1 85 55" fill="none" stroke="#d4d4d8" strokeWidth="2.5" strokeLinecap="round" />
        {/* Left Ear Cushion */}
        <rect x="8" y="48" width="14" height="24" rx="6" fill="#27272a" stroke="#18181b" strokeWidth="2" />
        <rect x="22" y="52" width="4" height="16" rx="1" fill="#71717a" />
        {/* Right Ear Cushion */}
        <rect x="78" y="48" width="14" height="24" rx="6" fill="#27272a" stroke="#18181b" strokeWidth="2" />
        <rect x="74" y="52" width="4" height="16" rx="1" fill="#71717a" />
        {/* Details */}
        <path d="M 15 52 L 15 48" stroke="#18181b" strokeWidth="3" />
        <path d="M 85 52 L 85 48" stroke="#18181b" strokeWidth="3" />
      </svg>
    </div>
  </div>
);

const FilmStripSeparator = () => (
  <div className="w-full overflow-hidden bg-[#18181b] border-t-4 border-b-4 border-dashed border-[#faf9f6] py-3.5 my-12 relative select-none pointer-events-none shadow-md">
    <div className="flex gap-16 animate-infinite-scroll items-center justify-around whitespace-nowrap text-zinc-300 font-mono tracking-[0.2em] text-xs">
      <span>HAION EV HISTORY</span>
      <span>•</span>
      <span>SCENE 01 / TAKE 01</span>
      <span>•</span>
      <span>DIRECTOR: AMIT SHARMA</span>
      <span>•</span>
      <span>HAION EV HISTORY</span>
      <span>•</span>
      <span>SCENE 01 / TAKE 01</span>
    </div>
  </div>
);

export default function AboutUs({ onClose, onCareersClick }) {
  const cms = useCMSAbout();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="vintage-theme min-h-screen pt-28 pb-32 px-4 md:px-8 relative overflow-hidden selection:bg-[#a0825b] selection:text-white">
      {/* Embedded Style Block for complete modular CSS control */}
      <style>{`
        .vintage-theme {
          background-color: #faf9f6;
          background-image: 
            radial-gradient(#e5e5e0 1px, transparent 1px),
            radial-gradient(#e5e5e0 1px, #faf9f6 1px);
          background-size: 24px 24px;
          background-position: 0 0, 12px 12px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .about-card {
          background: #ffffff;
          border: 2px solid #18181b;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 6px 6px 0px rgba(24, 24, 27, 0.9);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .about-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 8px 8px 0px rgba(24, 24, 27, 1);
        }

        .text-glow {
          text-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        @keyframes infinite-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 20s linear infinite;
        }
      `}</style>

      {/* BACKGROUND WATERMARKS (Top-Left Scooter, Top-Right Battery/Blueprint) */}
      <div className="absolute top-10 left-[-60px] w-80 h-80 opacity-[0.04] pointer-events-none select-none z-0">
        <img src={cms.bgImages.scooter} alt="" className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-20 right-[-100px] w-[500px] h-[500px] opacity-[0.03] pointer-events-none select-none z-0">
        <img src={cms.bgImages.battery} alt="" className="w-full h-full object-contain pointer-events-none" />
      </div>

      {/* FLOATING RETRO MUSIC & MOVIE STICKERS IN SIDE MARGINS */}
      <CassetteSticker className="top-[25%] left-2 xl:left-8 scale-110 md:scale-125 rotate-[15deg] hidden lg:block" />
      <MusicNotesSticker className="top-[35%] right-2 xl:right-8 scale-125 md:scale-150 -rotate-[10deg] hidden lg:block" />
      <HeadphonesSticker className="top-[55%] left-3 xl:left-10 scale-110 md:scale-125 rotate-[8deg] hidden lg:block" />
      <TicketSticker className="top-[70%] right-2 xl:right-8 scale-110 rotate-[-12deg] hidden lg:block" />
      <PopcornSticker className="top-[85%] left-3 xl:left-10 scale-110 md:scale-125 rotate-[12deg] hidden lg:block" />
      <CassetteSticker className="top-[95%] right-4 xl:right-12 scale-110 rotate-[-8deg] hidden lg:block" />

      <div className="max-w-7xl mx-auto relative z-10">
        


        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs font-bold tracking-widest text-[#a0825b] uppercase mb-3">
            {cms.hero.badge}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#40321f] mb-4 text-glow">
            {cms.hero.title}
          </h1>
          <p className="text-zinc-550 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            {cms.hero.subtitle}
          </p>
        </div>

        {/* 3-CARD GRID DESIGN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative">
          <TicketSticker className="-top-12 -left-6 scale-90 md:scale-100" />
          <FilmCanisterSticker className="-bottom-10 -right-8 scale-90 md:scale-100" />

          {cms.cards.map((card) => (
          <div key={card.title} className="about-card flex flex-col md:-rotate-1 relative">
            <div className="h-48 overflow-hidden border-b-2 border-zinc-900 bg-zinc-50">
              <img 
                src={card.image} 
                alt={card.alt || card.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 md:p-8 flex-1 flex flex-col text-left">
              <h3 className="text-xl font-bold text-[#40321f] mb-4">{card.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-650 font-medium">{card.body}</p>
            </div>
          </div>
          ))}

        </div>

        {/* LEADERSHIP TEAM SECTION */}
        <div className="about-card max-w-5xl mx-auto mb-16 text-left relative md:rotate-1">
          <TicketSticker className="-top-12 -left-8 scale-90 md:scale-100" />
          <PopcornSticker className="-bottom-12 -right-8 scale-90 md:scale-100" />
          
          <div className="p-8 md:p-10">
            <span className="text-xs font-bold text-[#a0825b] block mb-2">{cms.leadership.badge}</span>
            <h3 className="text-2xl font-black mb-8 text-[#40321f] border-b-2 border-zinc-900 pb-2 inline-block">
              {cms.leadership.title}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {cms.leadership.members.map((member, index) => (
                <div key={index} className="bg-[#faf9f6] border-2 border-zinc-900 rounded-2xl p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(24,24,27,0.9)] duration-300">
                  <div className="w-14 h-14 rounded-full bg-[#a0825b]/10 border-2 border-[#a0825b]/30 flex items-center justify-center font-black text-base text-[#a0825b] mb-3 shadow-inner">
                    {member.initials}
                  </div>
                  <h4 className="text-sm font-bold text-[#40321f] mb-1 leading-tight">{member.name}</h4>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* FILM STRIP TRANSITION ACCENT */}
        <FilmStripSeparator />

        {/* FULL JOURNEY SECTION */}
        <div className="about-card max-w-4xl mx-auto mb-16 text-left relative md:rotate-1">
          <PopcornSticker className="-top-12 -left-8 scale-90 md:scale-100" />
          <MusicNotesSticker className="-bottom-8 -right-8 scale-90 md:scale-100" />
          
          <div className="p-8 md:p-10">
            <h3 className="text-2xl font-black mb-6 text-[#40321f] border-b-2 border-zinc-900 pb-2 inline-block">
              {cms.journey.title}
            </h3>
            <div className="text-sm leading-relaxed text-zinc-650 space-y-4 font-medium">
              {cms.journey.paragraphs.map((p, i) => (
                <p key={i} className={p === cms.journey.highlightParagraph ? 'font-bold text-base text-[#40321f] mt-6' : p === cms.journey.paragraphs.at(-1) ? 'font-bold text-center text-[#40321f] bg-[#faf9f6] py-3 rounded-xl max-w-lg mx-auto' : ''}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* FOUNDER MESSAGE CARD */}
        <div className="about-card max-w-4xl mx-auto mb-16 text-left relative md:-rotate-1">
          <TicketSticker className="-bottom-8 -right-8 scale-90 md:scale-100" />
          <HeadphonesSticker className="-top-12 -left-8 scale-90 md:scale-100" />
          
          <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <span className="text-xs font-bold text-[#a0825b] block mb-2">{cms.founder.badge}</span>
              <h3 className="text-2xl font-bold mb-4 text-[#40321f]">{cms.founder.title}</h3>
              <span className="text-5xl text-[#a0825b]/20 block -mt-4">"</span>
              <p className="text-sm italic leading-relaxed text-zinc-650 mb-4">
                "{cms.founder.quote}"
              </p>
            </div>
            <div className="md:w-72 border-t md:border-t-0 md:border-l-2 border-dashed border-zinc-400 pt-6 md:pt-0 md:pl-6 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#a0825b]/10 flex items-center justify-center font-bold text-sm text-[#a0825b]">{cms.founder.initials}</div>
                <div>
                  <h5 className="text-sm font-bold text-[#40321f]">{cms.founder.name}</h5>
                  <p className="text-[11px] text-[#a0825b] font-bold uppercase tracking-wider">{cms.founder.role}</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 leading-tight">
                    {cms.founder.tagline}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CAREERS / WORK WITH US STRIP */}
        <div className="about-card max-w-4xl mx-auto text-left relative md:rotate-1">
          <FilmCanisterSticker className="-top-12 -right-8 scale-90 md:scale-100" />
          <CassetteSticker className="-bottom-8 -left-8 scale-90 md:scale-100" />

          <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1">
              <span className="text-xs font-bold text-[#a0825b] block mb-2">{cms.careers.badge}</span>
              <h3 className="text-xl font-bold mb-2 text-[#40321f]">{cms.careers.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-550 mb-2">
                {cms.careers.body}
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  console.log("Work With Us clicked. onCareersClick is:", onCareersClick);
                  if (onCareersClick) onCareersClick();
                }}
                className="w-full md:w-auto inline-flex items-center justify-center bg-[#40321f] hover:bg-[#5a4831] text-white font-bold py-3.5 px-8 rounded-full text-sm tracking-wider uppercase transition-all duration-300 shadow-md cursor-pointer border-2 border-zinc-900"
              >
                {cms.careers.ctaLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Brand Tagline */}
        <div className="text-center py-12">
          <p className="text-lg md:text-xl font-bold text-[#40321f] italic">
            {cms.tagline}
          </p>
        </div>

      </div>
    </div>
  );
}
