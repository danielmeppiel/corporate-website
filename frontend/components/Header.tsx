import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="site-header">
      <h1>Corporate Website</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
  );
};
