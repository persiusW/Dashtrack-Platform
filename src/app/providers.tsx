"use client";

type Props = { children: React.ReactNode };

export default function Providers({ children }: Props) {
  // Drop in next-themes later if you want; for now just pass-through
  return <>{children}</>;
}