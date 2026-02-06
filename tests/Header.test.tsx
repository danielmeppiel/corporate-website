/**
 * Test suite for Header component
 * Ensures navigation structure, accessibility, and proper rendering
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../frontend/components/Header';

describe('Header Component', () => {
  it('renders the site header with correct title', () => {
    render(<Header />);
    
    const heading = screen.getByRole('heading', { name: /corporate website/i });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });

  it('renders navigation with all required links', () => {
    render(<Header />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /contact/i });
    
    expect(homeLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
  });

  it('has correct href attributes for navigation links', () => {
    render(<Header />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const contactLink = screen.getByRole('link', { name: /contact/i });
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('renders header with correct semantic structure', () => {
    const { container } = render(<Header />);
    
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('site-header');
  });

  it('renders navigation inside header element', () => {
    const { container } = render(<Header />);
    
    const header = container.querySelector('header');
    const nav = header?.querySelector('nav');
    
    expect(nav).toBeInTheDocument();
    expect(nav?.children.length).toBe(3);
  });

  it('maintains proper link order in navigation', () => {
    render(<Header />);
    
    const links = screen.getAllByRole('link');
    
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent(/home/i);
    expect(links[1]).toHaveTextContent(/about/i);
    expect(links[2]).toHaveTextContent(/contact/i);
  });

  it('renders with accessible landmark role', () => {
    render(<Header />);
    
    const headerElement = screen.getByRole('banner');
    expect(headerElement).toBeInTheDocument();
  });
});
