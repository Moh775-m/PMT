import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, PlusCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/posts" className="brand">
        PMT — PixelMindTrainning
      </Link>

      <button
        type="button"
        className="navbar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <a href="/tasks" className="nav-link">
          All Tasks
        </a>
        <NavLink
          to="/posts"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={() => setIsOpen(false)}
        >
          Posts
        </NavLink>
        <NavLink
          to="/posts/new"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={() => setIsOpen(false)}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <PlusCircle size={15} />
            + New Post
          </span>
        </NavLink>
        <a href="/api/tasks" className="nav-link">
          JSON API
        </a>
        <a href="/docs/api" className="nav-link">
          API Docs
        </a>
      </div>
    </nav>
  );
};
