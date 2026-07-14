import Hero from '../components/sections/Hero';
import TrustStats from '../components/sections/TrustStats';
import Features from '../components/sections/Features';
import Categories from '../components/sections/Categories';
import WhoWeAre from '../components/sections/WhoWeAre';
import AppExperience from '../components/sections/AppExperience';
import HaionAdvantage from '../components/sections/HaionAdvantage';
import ProductsTabs from '../components/sections/ProductsTabs';
import WhyChooseHaion from '../components/sections/WhyChooseHaion';
import HowItWorks from '../components/sections/HowItWorks';
import Testimonials from '../components/sections/Testimonials';
import FAQ from '../components/sections/FAQ';
import Contact from '../components/sections/Contact';
import Brands from '../components/sections/Brands';
import DownloadCTA from '../components/sections/DownloadCTA';
import Offers from '../components/sections/Offers';
import ScrollSequence from '../components/sections/ScrollSequence';
import { useCMS } from './CMSContext';

const SECTION_MAP = {
  hero: Hero,
  'trust-stats': TrustStats,
  features: Features,
  categories: Categories,
  'who-we-are': WhoWeAre,
  'app-experience': AppExperience,
  'haion-advantage': HaionAdvantage,
  'products-tabs': ProductsTabs,
  'why-choose-haion': WhyChooseHaion,
  'how-it-works': HowItWorks,
  testimonials: Testimonials,
  faq: FAQ,
  contact: Contact,
  brands: Brands,
  'download-cta': DownloadCTA,
  offers: Offers,
  'scroll-sequence': ScrollSequence,
};

export default function SectionRenderer({ onViewDetails }) {
  const { visibleSections, isLoading, apiOnline } = useCMS();

  if (isLoading && !visibleSections.length) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  const sections =
    visibleSections.length > 0
      ? visibleSections
      : !apiOnline
        ? Object.keys(SECTION_MAP).map((key, order) => ({
            sectionKey: key,
            order,
            isVisible: true,
          }))
        : [];

  return (
    <>
      {sections.map((section) => {
        const Component = SECTION_MAP[section.sectionKey];
        if (!Component) return null;
        const props = section.sectionKey === 'products-tabs' ? { onViewDetails } : {};
        return <Component key={section.sectionKey} {...props} />;
      })}
    </>
  );
}
