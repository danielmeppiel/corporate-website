import React from 'react';

/**
 * Site header component with navigation
 * 
 * @component
 * @example
 * // Basic usage in layout
 * import { Header } from './components/Header';
 * 
 * function Layout({ children }) {
 *   return (
 *     <div className="app">
 *       <Header />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 * 
 * @remarks
 * **Accessibility Features:**
 * - Semantic HTML with `<header>` and `<nav>` elements
 * - Heading hierarchy maintained with `<h1>` for site title
 * - Navigation links use anchor tags for keyboard accessibility
 * - Follows WCAG 2.1 AA guidelines for landmark regions
 * 
 * **Design System:**
 * - Uses `site-header` class from design-guidelines dependency
 * - Responsive design with mobile-first approach
 * - Consistent spacing and typography
 * 
 * **Navigation Structure:**
 * - Home: Main landing page
 * - About: Company information
 * - Contact: Contact form page
 * 
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/|WAI-ARIA Landmark Patterns}
 * 
 * @returns {JSX.Element} Header component with site title and navigation links
 */
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
