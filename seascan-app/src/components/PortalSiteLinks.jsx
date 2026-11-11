// src/components/PortalSiteLinks.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, BookOpen, MapPin, UserCog } from 'lucide-react';

const tools = [
  { name: 'Scanner', slug: '/scanner', icon: Camera },
  { name: 'Species Library', slug: '/library', icon: BookOpen },
  { name: 'Distribution Map', slug: '/map', icon: MapPin },
];

/**
 * SeaScan tools inside a role portal. They render the same public pages but
 * nested under the portal's own path (e.g. /admin/scanner), so the sidebar
 * stays put instead of dropping the user out into the public site.
 * `activeClass` is a literal string because Tailwind cannot see composed names.
 */
export default function PortalSiteLinks({
  base,
  activeClass = 'bg-slate-800 text-white',
  divider = true,
}) {
  const location = useLocation();

  return (
    <div className={`space-y-1 ${divider ? 'pt-4 mt-2 border-t border-slate-800' : ''}`}>
      <p className="px-3.5 pb-1 text-xs text-slate-600">
        SeaScan Tools
      </p>

      {tools.map((tool) => {
        const Icon = tool.icon;
        const to = `${base}${tool.slug}`;
        const isActive = location.pathname === to;
        return (
          <Link
            key={tool.slug}
            to={to}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
              isActive ? activeClass : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tool.name}</span>
          </Link>
        );
      })}

      {/* My Account (scan history, sightings, profile), shown inside the portal. */}
      <Link
        to={`${base}/account`}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
          location.pathname === `${base}/account` ? activeClass : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
      >
        <UserCog className="w-4 h-4" />
        <span>Account settings</span>
      </Link>
    </div>
  );
}
