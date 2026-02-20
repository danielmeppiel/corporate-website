/**
 * Test suite for Header component
 * Comprehensive coverage for simple navigation component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../frontend/components/Header';

describe('Header Component', () => {
  describe('Rendering', () => {
    it('renders the header element with correct className', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('site-header');
    });

    it('renders the main heading with correct text', () => {
      render(<Header />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Corporate Website');
    });

    it('renders navigation element', () => {
      const { container } = render(<Header />);
      const nav = container.querySelector('nav');
      
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders all three navigation links', () => {
      render(<Header />);
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('renders Home link with correct href', () => {
      render(<Header />);
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('renders About link with correct href', () => {
      render(<Header />);
      
      const aboutLink = screen.getByRole('link', { name: /about/i });
      expect(aboutLink).toBeInTheDocument();
      expect(aboutLink).toHaveAttribute('href', '/about');
    });

    it('renders Contact link with correct href', () => {
      render(<Header />);
      
      const contactLink = screen.getByRole('link', { name: /contact/i });
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute('href', '/contact');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure with header and nav elements', () => {
      const { container } = render(<Header />);
      
      const header = container.querySelector('header');
      const nav = container.querySelector('nav');
      
      expect(header).toBeInTheDocument();
      expect(nav).toBeInTheDocument();
      expect(header).toContainElement(nav);
    });

    it('all navigation links are accessible', () => {
      render(<Header />);
      
      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        expect(link).toBeVisible();
        expect(link).toHaveAccessibleName();
      });
    });

    it('has a single h1 heading for document structure', () => {
      render(<Header />);
      
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
    });
  });

  describe('Component Structure', () => {
    it('renders as a functional component', () => {
      const component = <Header />;
      expect(component).toBeDefined();
      expect(component.type).toBe(Header);
    });

    it('contains heading inside header element', () => {
      const { container } = render(<Header />);
      
      const header = container.querySelector('header');
      const heading = screen.getByRole('heading', { level: 1 });
      
      expect(header).toContainElement(heading);
    });

    it('contains navigation inside header element', () => {
      const { container } = render(<Header />);
      
      const header = container.querySelector('header');
      const nav = container.querySelector('nav');
      
      expect(header).toContainElement(nav);
    });
  });

  describe('Content Verification', () => {
    it('renders correct text content for all elements', () => {
      const { container } = render(<Header />);
      
      expect(screen.getByText('Corporate Website')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('navigation links appear in correct order', () => {
      render(<Header />);
      
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveTextContent('Home');
      expect(links[1]).toHaveTextContent('About');
      expect(links[2]).toHaveTextContent('Contact');
    });
  });

  describe('Edge Cases', () => {
    it('renders without props', () => {
      expect(() => render(<Header />)).not.toThrow();
    });

    it('renders consistently on multiple renders', () => {
      const { container: container1 } = render(<Header />);
      const { container: container2 } = render(<Header />);
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('is a pure component with no side effects', () => {
      const renderCount1 = render(<Header />);
      const renderCount2 = render(<Header />);
      
      expect(renderCount1.container.innerHTML).toBe(renderCount2.container.innerHTML);
    });
  });
});
