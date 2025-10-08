import React from "react";

export interface BaseLayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ header, footer, children }) => (
  <div className="min-h-screen flex flex-col">
    {header}
    <main className="flex-1">{children}</main>
    {footer}
  </div>
);

export default BaseLayout;

