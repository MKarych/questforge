'use client';

import { usePathname } from 'next/navigation';
import ScrollToTop from '@/components/ui/ScrollToTop';

export default function ScrollToTopWrapper() {
  const pathname = usePathname();

  // Не показываем в редакторе сценария
  if (pathname.startsWith('/organizer/scenarios/') && pathname.includes('/edit')) {
    return null;
  }

  return <ScrollToTop />;
}