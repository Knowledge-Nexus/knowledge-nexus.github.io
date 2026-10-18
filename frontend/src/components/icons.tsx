// Ícones de traço simples (24×24), desenhados à mão para o projecto.

import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11.5 12 5l8 6.5" />
    <path d="M6.5 10v9h11v-9" />
    <path d="M10 19v-5h4v5" />
  </Svg>
);

export const IconInbox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v9" />
    <path d="m8.5 9.5 3.5 3.5 3.5-3.5" />
    <path d="M4 14h4l1.5 2.5h5L16 14h4v5H4z" />
  </Svg>
);

export const IconBooks = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="4" height="16" rx="1" />
    <rect x="9.5" y="6" width="4" height="14" rx="1" />
    <path d="m15.5 7.2 3.4-.9 2.6 13-3.4.9z" />
  </Svg>
);

export const IconCheckList = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 7 1.8 1.8L9 5.5" />
    <path d="m4 14 1.8 1.8L9 12.5" />
    <path d="M12 7h8M12 14h8M12 19.5h5" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 7h9M18 7h1M5 12h3M12 12h7M5 17h11M20 17h-1" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="17" r="2" />
  </Svg>
);

export const IconFile = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3.5h7l4 4v13H7z" />
    <path d="M14 3.5v4h4" />
  </Svg>
);

export const IconSlides = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="11" rx="1.5" />
    <path d="M12 16v3.5M8.5 19.5h7" />
  </Svg>
);

export const IconCode = (p: IconProps) => (
  <Svg {...p}>
    <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" />
  </Svg>
);

export const IconImage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 3.5 3 2.5-2 5 3.5" />
  </Svg>
);

export const IconArchive = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="4.5" rx="1" />
    <path d="M5.5 8.5V20h13V8.5M10 12h4" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />
  </Svg>
);

export const IconPen = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 5.5 4 4L9 19H5v-4z" />
    <path d="m12.5 7.5 4 4" />
  </Svg>
);

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16" />
    <path d="M12 4c2.2 2.3 3.2 5 3.2 8s-1 5.7-3.2 8c-2.2-2.3-3.2-5-3.2-8s1-5.7 3.2-8z" />
  </Svg>
);

export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
);

export const IconHelp = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" />
    <path d="M12 16.9v.2" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M5 19h14" />
  </Svg>
);

export const IconStack = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 4 8 4-8 4-8-4z" />
    <path d="m4 12 8 4 8-4" />
    <path d="m4 16 8 4 8-4" />
  </Svg>
);

// Modo de leitura e edição.

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Svg>
);

export const IconBookOpen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.5c-2-1.4-4.6-2-8-2v13c3.4 0 6 .6 8 2 2-1.4 4.6-2 8-2v-13c-3.4 0-6 .6-8 2z" />
    <path d="M12 6.5v13" />
  </Svg>
);

export const IconPage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
    <path d="M9 8h6M9 11.5h6M9 15h4" />
  </Svg>
);

export const IconFitWidth = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5v14M20 5v14" />
    <path d="M7.5 12h9M10 9.5 7.5 12l2.5 2.5M14 9.5l2.5 2.5-2.5 2.5" />
  </Svg>
);

export const IconFitPage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4" />
  </Svg>
);

export const IconRotate = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12a7 7 0 1 1-2.05-4.95" />
    <path d="M19 4.5v4h-4" />
  </Svg>
);

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />
  </Svg>
);

export const IconExpand = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 9.5v-5h5M19.5 9.5v-5h-5M4.5 14.5v5h5M19.5 14.5v5h-5" />
  </Svg>
);

export const IconList = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 7h11M9 12h11M9 17h11" />
    <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
  </Svg>
);

export const IconHand = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 12.5V6.8a1.4 1.4 0 0 1 2.8 0V11M10.8 10.5V5.4a1.4 1.4 0 0 1 2.8 0v5.1M13.6 10.5V6.4a1.4 1.4 0 0 1 2.8 0v5.6" />
    <path d="M16.4 9.5a1.4 1.4 0 0 1 2.8 0v4c0 3.6-2.7 6.5-6.5 6.5-2.4 0-4-1-5.3-2.8l-2.6-3.7a1.4 1.4 0 0 1 2.2-1.7L8 13" />
  </Svg>
);

export const IconHighlighter = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 4.5 4.5 4.5-7.5 7.5H7.5V12z" />
    <path d="m7.5 16.5-3 3h5" />
    <path d="M12.5 7 17 11.5" />
  </Svg>
);

export const IconUnderline = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.5 4.5v6a4.5 4.5 0 0 0 9 0v-6" />
    <path d="M5.5 19.5h13" />
  </Svg>
);

export const IconEraser = (p: IconProps) => (
  <Svg {...p}>
    <path d="m10 19.5-5-5a1.5 1.5 0 0 1 0-2.1l7.4-7.4a1.5 1.5 0 0 1 2.1 0l4.6 4.6a1.5 1.5 0 0 1 0 2.1L11.6 19.5z" />
    <path d="M10 19.5h9.5M8 10.5l6 6" />
  </Svg>
);

export const IconUndo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 7.5 4.5 12 9 16.5" />
    <path d="M4.5 12H15a4.5 4.5 0 0 1 0 9h-2" />
  </Svg>
);

export const IconRedo = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 7.5 4.5 4.5-4.5 4.5" />
    <path d="M19.5 12H9a4.5 4.5 0 0 0 0 9h2" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7" />
    <path d="m6.5 7 .9 12.5h9.2L17.5 7" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
  </Svg>
);

export const IconEye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const IconText = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 6.5h14M12 6.5v12M9 18.5h6" />
  </Svg>
);

export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15.5 5.5 18.5 8.5 9 18H6v-3z" />
    <path d="m13.5 7.5 3 3" />
  </Svg>
);

export const IconClearPage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
    <path d="m9.5 11.5 5 5M14.5 11.5l-5 5" />
  </Svg>
);
