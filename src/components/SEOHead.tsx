import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'event';
  keywords?: string;
  eventData?: {
    name: string;
    startDate: string;
    endDate?: string;
    location: string;
    description: string;
    organizer: string;
  };
}

// Structured data for the organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KAIZEN - RIT Tech Fest",
  "url": "https://kaizen.rit.edu",
  "logo": "https://kaizen.rit.edu/kaizen-logo.png",
  "sameAs": [
    "https://instagram.com/kaizen_rit",
    "https://twitter.com/kaizen_rit"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "kaizen@rit.edu"
  }
};

// Structured data for the event
const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "KAIZEN Tech Fest 2024 - Stranger Things Edition",
  "description": "The Official Tech Festival of RIT featuring technical competitions, workshops, and cultural events with a Stranger Things theme.",
  "startDate": "2024-12-15T09:00:00+05:30",
  "endDate": "2024-12-17T21:00:00+05:30",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Rajiv Gandhi Institute of Technology",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "RIT Campus",
      "addressLocality": "Bangalore",
      "addressRegion": "Karnataka",
      "postalCode": "560032",
      "addressCountry": "IN"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "KAIZEN - RIT",
    "url": "https://kaizen.rit.edu"
  },
  "performer": {
    "@type": "Organization",
    "name": "RIT Students"
  },
  "offers": {
    "@type": "Offer",
    "price": "100",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "validFrom": "2024-11-01",
    "url": "https://kaizen.rit.edu/#register"
  },
  "image": "https://kaizen.rit.edu/kaizen-logo.png"
};

// Website schema for search engines
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "KAIZEN Tech Fest",
  "url": "https://kaizen.rit.edu",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kaizen.rit.edu/events?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export function SEOHead({
  title = 'KAIZEN 2024 - Stranger Things Edition | RIT Tech Fest',
  description = 'Join KAIZEN 2024, the premier technical festival of RIT with a Stranger Things theme. Register for exciting tech events, competitions, hackathons, and workshops. Experience innovation and creativity!',
  image = 'https://kaizen.rit.edu/kaizen-logo.png',
  url = typeof window !== 'undefined' ? window.location.href : 'https://kaizen.rit.edu',
  type = 'website',
  keywords = 'KAIZEN, tech fest, RIT, technical festival, stranger things, hackathon, coding competition, robotics, workshops, college fest, Bangalore, Karnataka, tech events 2024',
}: SEOHeadProps) {
  useEffect(() => {
    // Update page title
    document.title = title;

    // Update or create meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'KAIZEN Team - RIT' },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'bingbot', content: 'index, follow' },

      // Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'KAIZEN Tech Fest 2024 - Stranger Things Edition' },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: 'KAIZEN Tech Fest' },
      { property: 'og:locale', content: 'en_IN' },

      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@kaizen_rit' },
      { name: 'twitter:creator', content: '@kaizen_rit' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },

      // Additional SEO tags
      { name: 'theme-color', content: '#dc2626' },
      { name: 'msapplication-TileColor', content: '#000000' },
      { name: 'application-name', content: 'KAIZEN' },

      // Geo tags for local SEO
      { name: 'geo.region', content: 'IN-KA' },
      { name: 'geo.placename', content: 'Bangalore' },

      // Facebook App ID (if you have one)
      // { property: 'fb:app_id', content: 'YOUR_FB_APP_ID' },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const attribute = name ? 'name' : 'property';
      const value = name || property;

      let meta = document.querySelector(`meta[${attribute}="${value}"]`);

      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, value!);
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);
    });

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Add structured data (JSON-LD)
    const existingSchemas = document.querySelectorAll('script[type="application/ld+json"]');
    existingSchemas.forEach(s => s.remove());

    // Add organization schema
    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(organizationSchema);
    document.head.appendChild(orgScript);

    // Add event schema
    const eventScript = document.createElement('script');
    eventScript.type = 'application/ld+json';
    eventScript.text = JSON.stringify(eventSchema);
    document.head.appendChild(eventScript);

    // Add website schema
    const websiteScript = document.createElement('script');
    websiteScript.type = 'application/ld+json';
    websiteScript.text = JSON.stringify(websiteSchema);
    document.head.appendChild(websiteScript);

    // Cleanup function
    return () => {
      const schemas = document.querySelectorAll('script[type="application/ld+json"]');
      schemas.forEach(s => s.remove());
    };

  }, [title, description, image, url, type, keywords]);

  return null;
}

