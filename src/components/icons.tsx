import type { ReactNode } from "react";

const P = {
  dashboard: (<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" /><rect x="13.5" y="11" width="7" height="9.5" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /></>),
  clipboard: (<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 2.5h6V6H9z" /><path d="M8.5 11.5l2.2 2.2 4.3-4.7" /><path d="M8.5 17h7" /></>),
  qr: (<><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2.6v2.6H14zM17.4 17.4H20V20h-2.6zM14 19.5h1.5M20 14.5V16" /></>),
  scan: (<><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M4 12h16" /></>),
  wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  press: (<><path d="M4 4h16v3H4z" /><path d="M6.5 7v10M17.5 7v10" /><path d="M9.5 9.5h5V14h-5z" /><path d="M12 7v2.5M4 20h16" /></>),
  robot: (<><path d="M4 21h9" /><path d="M7.5 21v-3.5L11.5 11" /><path d="M11.5 11l5.5-3" /><circle cx="7.5" cy="17" r="1.5" /><circle cx="11.5" cy="11" r="1.5" /><circle cx="17.5" cy="7.5" r="1.5" /><path d="M17.5 7.5L21 5M17.5 7.5l3.5 2" /></>),
  compressor: (<><rect x="3" y="9" width="14" height="8.5" rx="2.5" /><circle cx="17" cy="6" r="2.2" /><path d="M17 6l1.1-1.1M17 8.2V9M6 17.5v2M14 17.5v2M6.5 13.2h3" /></>),
  forklift: (<><path d="M3 15.5V9.5h5l3 6z" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="12" cy="17.5" r="1.8" /><path d="M8 15.5h4M16.5 3.5v14M16.5 13.5v4h4.5" /></>),
  flame: <path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-2.1 1-4 2.5-5.5.2 1.3.8 2.3 2 2.8-.6-2.4-.3-4.6.5-6.3z" />,
  bolt: <path d="M13 2 5 13h5l-1 9 8-11h-5l1-9z" />,
  gear: (<><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.2 2.2M16.6 16.6l2.2 2.2M18.8 5.2l-2.2 2.2M7.4 16.6l-2.2 2.2" /></>),
  users: (<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5" /><path d="M15.5 5.3a3.2 3.2 0 0 1 0 5.4M17.3 14.7c1.9.8 2.9 2.4 3.2 4.8" /></>),
  user: (<><circle cx="12" cy="8" r="3.6" /><path d="M5.5 20c.7-3.6 3.2-5.6 6.5-5.6s5.8 2 6.5 5.6" /></>),
  chart: (<><path d="M3.5 20.5h17" /><path d="M6 20.5v-6.5M11 20.5V6M16 20.5v-9.5M20.5 20.5V9" /></>),
  bell: (<><path d="M6 16.5v-5.5a6 6 0 0 1 12 0v5.5L19.5 19h-15z" /><path d="M10 21.5a2.3 2.3 0 0 0 4 0" /></>),
  shield: (<><path d="M12 3l7 2.8V11c0 4.6-3 8.6-7 10-4-1.4-7-5.4-7-10V5.8z" /><path d="M9 11.5l2.1 2.1 4-4.6" /></>),
  camera: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8.5 7 10 4h4l1.5 3" /><circle cx="12" cy="13.3" r="3.4" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  pen: (<><path d="M14.5 5l4.5 4.5L8.5 20H4v-4.5z" /><path d="M12.5 7l4.5 4.5" /></>),
  trash: (<><path d="M4.5 6.5h15M9.5 6.5v-2h5v2M6.5 6.5l1 13.5h9l1-13.5" /><path d="M10 10.5v5.5M14 10.5v5.5" /></>),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  alert: (<><path d="M12 3.5 22 20H2z" /><path d="M12 10v4.2M12 17.1v.4" /></>),
  info: (<><circle cx="12" cy="12" r="8.7" /><path d="M12 11v5M12 7.8v.4" /></>),
  printer: (<><path d="M7 8V3.5h10V8" /><rect x="4" y="8" width="16" height="8" rx="1.5" /><path d="M7 13h10v7.5H7z" /></>),
  download: <path d="M12 3v11M7.5 10.5 12 15l4.5-4.5M4 20h16" />,
  upload: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 20h16" />,
  doc: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 15.5h6" /></>),
  sheet: (<><rect x="4" y="3.5" width="16" height="17" rx="1.5" /><path d="M4 9h16M9.5 9v11.5M15 9v11.5" /></>),
  search: (<><circle cx="10.5" cy="10.5" r="6" /><path d="M15.5 15.5 20.5 20.5" /></>),
  calendar: (<><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>),
  clock: (<><circle cx="12" cy="12" r="8.7" /><path d="M12 7v5.2l3.4 2" /></>),
  chevD: <path d="M6 9.5l6 6 6-6" />,
  chevL: <path d="M14.5 6l-6 6 6 6" />,
  chevR: <path d="M9.5 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  eye: (<><path d="M3 12s3.5-6.2 9-6.2S21 12 21 12s-3.5 6.2-9 6.2S3 12 3 12z" /><circle cx="12" cy="12" r="2.6" /></>),
  lock: (<><rect x="5.5" y="10.5" width="13" height="10" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>),
  logout: (<><path d="M9.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3.5" /><path d="M15 8l4 4-4 4M19 12H9" /></>),
  phone: <path d="M5 4h4l1.5 4.5-2.2 1.6a13 13 0 0 0 5.6 5.6l1.6-2.2L20 15v4a1.8 1.8 0 0 1-2 1.8A16.5 16.5 0 0 1 3.2 6 1.8 1.8 0 0 1 5 4z" />,
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></>),
  msg: <path d="M4 5h16v11H9l-5 4.5z" />,
  image: (<><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.7" /><path d="M3.5 16.5 9 12l4 3.5 3-2.5 4.5 4" /></>),
  mic: (<><rect x="9.5" y="3" width="5" height="10" rx="2.5" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4" /></>),
  video: (<><rect x="3" y="6.5" width="13" height="11" rx="2" /><path d="M16 10.5l5-3v9l-5-3z" /></>),
  pin: (<><path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.3" /></>),
  refresh: (<><path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" /><path d="M20 4v4h-4M4 20v-4h4" /></>),
  history: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  power: (<><path d="M12 3v8" /><path d="M6.3 6.5a8 8 0 1 0 11.4 0" /></>),
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  send: <path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10z" />,
  box: (<><path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z" /><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8" /></>),
  layers: (<><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13.5l9 5 9-5" /></>),
  filter: <path d="M4 5h16l-6.5 7.5V19l-3 1.5v-8z" />,
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20, className = "", sw = 1.8 }: { name: IconName; size?: number; className?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name] as ReactNode}
    </svg>
  );
}

export const ICON_CHOICES: IconName[] = ["press", "robot", "compressor", "forklift", "flame", "bolt", "gear", "wrench", "box", "layers"];

export const GROUP_COLORS = ["#e06f10", "#2f6f8f", "#0e7c7b", "#b98a1e", "#8f4a5e", "#5b7085", "#3f6b3f", "#7c3c0c"];

export function GroupGlyph({ icon, color, size = 40 }: { icon: string; color: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, background: color + "1c", color, border: `1px solid ${color}45`, borderRadius: size * 0.3 }}
      className="flex items-center justify-center shrink-0"
    >
      <Icon name={(ICON_CHOICES.includes(icon as IconName) ? icon : "box") as IconName} size={Math.round(size * 0.54)} />
    </div>
  );
}

export function NipcoLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
      <rect width="128" height="128" rx="26" fill="#151c24" />
      <g transform="translate(64,58)">
        <g fill="#e06f10">
          <rect x="-7" y="-46" width="14" height="16" rx="3" />
          <rect x="-7" y="30" width="14" height="16" rx="3" />
          <rect x="-46" y="-7" width="16" height="14" rx="3" />
          <rect x="30" y="-7" width="16" height="14" rx="3" />
          <rect x="-39" y="-39" width="15" height="14" rx="3" transform="rotate(45 -31.5 -32)" />
          <rect x="24" y="-39" width="15" height="14" rx="3" transform="rotate(-45 31.5 -32)" />
          <rect x="-39" y="25" width="15" height="14" rx="3" transform="rotate(-45 -31.5 32)" />
          <rect x="24" y="25" width="15" height="14" rx="3" transform="rotate(45 31.5 32)" />
        </g>
        <circle r="32" fill="#e06f10" />
        <circle r="20" fill="#151c24" />
        <text x="0" y="9" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="900" fill="#f2f5f8">N</text>
      </g>
    </svg>
  );
}
