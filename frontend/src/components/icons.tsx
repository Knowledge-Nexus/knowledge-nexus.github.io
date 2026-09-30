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

export function FileGlyph(props: { ext: string; kind: string; size?: number }) {
  const { ext, kind, size = 18 } = props;
  if (kind === "code_project" || ["py", "js", "ts", "java", "c", "cpp", "ipynb"].includes(ext)) {
    return <IconCode size={size} />;
  }
  if (kind === "archive") return <IconArchive size={size} />;
  if (["ppt", "pptx", "odp", "pps", "key"].includes(ext)) return <IconSlides size={size} />;
  if (["png", "jpg", "jpeg", "heic", "webp", "gif", "tif", "tiff"].includes(ext)) {
    return <IconImage size={size} />;
  }
  return <IconFile size={size} />;
}
