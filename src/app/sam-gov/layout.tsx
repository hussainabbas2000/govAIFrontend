import React from 'react';

export default function SamGovLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Basic layout, can be expanded later
}
