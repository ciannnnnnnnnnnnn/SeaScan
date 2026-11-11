// src/components/PortalTool.jsx
import { useLocation } from 'react-router-dom';
import ScannerPage from './ScannerPage';
import DigitalLibraryPage from '../pages/DigitalLibraryPage';
import DistributionMapPage from '../pages/DistributionMapPage';
import AccountPage from '../pages/AccountPage';

/**
 * Portals mount at a wildcard path (e.g. /admin/*). This resolves the trailing
 * segment to the matching public tool so the portal can render it inside its
 * own shell — same page, sidebar retained. Returns null on the portal index,
 * where the portal shows its own dashboard instead.
 */
export function usePortalTool(base) {
  const { pathname } = useLocation();
  const sub = pathname.startsWith(base) ? pathname.slice(base.length) : '';

  if (sub === '/scanner') return <ScannerPage />;
  if (sub === '/library') return <DigitalLibraryPage />;
  if (sub === '/map') return <DistributionMapPage />;
  if (sub === '/account') return <AccountPage />;
  return null;
}
