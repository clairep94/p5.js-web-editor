import React from 'react';

export function Admonition({
  children,
  title
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admonition">
      <p className="admonition__title">
        <strong>{title}</strong>
      </p>
      {children}
    </div>
  );
}
