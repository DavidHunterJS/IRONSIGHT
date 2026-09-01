import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

// Keep crawlers off the API routes: they are live upstream-backed endpoints, and
// a crawler walking them is exactly the amplification the rate limiter exists
// to prevent.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about'],
        disallow: ['/api/'],
      },
    ],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
