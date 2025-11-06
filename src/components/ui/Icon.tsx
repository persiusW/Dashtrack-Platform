
import React from "react";

export type IconName =
  | "overview"
  | "bolt"
  | "target"
  | "map"
  | "layers"
  | "users"
  | "link"
  | "settings";

export function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  const common = { className, fill: "currentColor", viewBox: "0 0 24 24" } as any;

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-17v5h6V3h-6Z" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <path d="M12 2v2a8 8 0 1 1-8 8H2a10 10 0 1 0 10-10Zm0 6a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6Z" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common}>
          <path d="m12 3 9 5-9 5-9-5 9-5Zm0 9 9 5-9 5-9-5 9-5Z" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M10 7h4v2h-4z" />
          <path d="M7 12a5 5 0 0 1 5-5h2v2h-2a3 3 0 1 0 0 6h2v2h-2a5 5 0 0 1-5-5Zm7-3h2a5 5 0 1 1 0 10h-2v-2h2a3 3 0 1 0 0-6h-2V9Z" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4a7.6 7.6 0 0 0-.1-1l2-1.5-2-3.5-2.3.8a7.7 7.7 0 0 0-1.8-1l-.3-2.4H9.5L9.2 4a7.7 7.7 0 0 0-1.8 1L5 4.9 3 8.4 5 9.9a7.6 7.6 0 0 0 0 2.2L3 13.6l2 3.5 2.4-.9a7.7 7.7 0 0 0 1.8 1l.3 2.4h4.1l.3-2.4a7.7 7.7 0 0 0 1.8-1l2.3.9 2-3.5-2-1.4c.1-.3.1-.7.1-1Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default Icon;
  