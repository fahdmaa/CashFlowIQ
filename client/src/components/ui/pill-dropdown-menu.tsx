import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './pill-dropdown-menu.css';

interface PillDropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  separator?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}

interface PillDropdownMenuProps {
  trigger: React.ReactNode;
  items: PillDropdownMenuItem[];
  align?: 'start' | 'center' | 'end';
  className?: string;
  triggerClassName?: string;
}

export function PillDropdownMenu({
  trigger,
  items,
  align = 'end',
  className = '',
  triggerClassName = ''
}: PillDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const hoverCircleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Initial setup
    if (menuRef.current) {
      gsap.set(menuRef.current, {
        opacity: 0,
        scale: 0.95,
        visibility: 'hidden',
        transformOrigin: align === 'start' ? 'top left' : align === 'center' ? 'top center' : 'top right'
      });
    }

    // Setup hover circle for trigger
    if (hoverCircleRef.current) {
      gsap.set(hoverCircleRef.current, {
        scale: 0,
        xPercent: -50,
        yPercent: -50,
        transformOrigin: 'center center'
      });
    }
  }, [align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const openDropdown = () => {
    setIsOpen(true);
    const menu = menuRef.current;

    if (menu) {
      gsap.set(menu, { visibility: 'visible' });
      gsap.to(menu, {
        opacity: 1,
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });

      // Stagger animation for menu items
      itemRefs.current.forEach((item, index) => {
        if (item && !item.classList.contains('is-separator')) {
          gsap.fromTo(item,
            { opacity: 0, y: -10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.2,
              delay: index * 0.02,
              ease: 'power2.out'
            }
          );
        }
      });
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    const menu = menuRef.current;

    if (menu) {
      gsap.to(menu, {
        opacity: 0,
        scale: 0.95,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(menu, { visibility: 'hidden' });
        }
      });
    }
  };

  const handleItemClick = (item: PillDropdownMenuItem) => {
    if (item.disabled || item.separator) return;

    if (item.onClick) {
      item.onClick();
    }

    if (item.href) {
      window.location.href = item.href;
    }

    closeDropdown();
  };

  const handleTriggerEnter = () => {
    if (hoverCircleRef.current) {
      gsap.to(hoverCircleRef.current, {
        scale: 1.2,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleTriggerLeave = () => {
    if (hoverCircleRef.current) {
      gsap.to(hoverCircleRef.current, {
        scale: 0,
        duration: 0.2,
        ease: 'power2.in'
      });
    }
  };

  const handleItemEnter = (index: number) => {
    const item = itemRefs.current[index];
    if (item && !item.classList.contains('is-separator') && !item.classList.contains('is-disabled')) {
      gsap.to(item, {
        x: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  };

  const handleItemLeave = (index: number) => {
    const item = itemRefs.current[index];
    if (item && !item.classList.contains('is-separator')) {
      gsap.to(item, {
        x: 0,
        backgroundColor: 'var(--pill-bg)',
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  };

  return (
    <div className={`pill-dropdown ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        className={`pill-dropdown-trigger ${triggerClassName}`}
        onClick={toggleDropdown}
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={handleTriggerLeave}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        type="button"
      >
        <span className="hover-circle" ref={hoverCircleRef} aria-hidden="true" />
        <span className="trigger-content">{trigger}</span>
      </button>

      <ul
        ref={menuRef}
        className={`pill-dropdown-menu align-${align}`}
        role="menu"
      >
        {items.map((item, index) => {
          if (item.separator) {
            return (
              <li
                key={`separator-${index}`}
                ref={el => itemRefs.current[index] = el}
                className="pill-dropdown-separator is-separator"
                role="separator"
              />
            );
          }

          return (
            <li
              key={`item-${index}`}
              ref={el => itemRefs.current[index] = el}
              className={`pill-dropdown-item ${item.disabled ? 'is-disabled' : ''} ${item.destructive ? 'is-destructive' : ''}`}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => handleItemEnter(index)}
              onMouseLeave={() => handleItemLeave(index)}
              role="menuitem"
              aria-disabled={item.disabled}
            >
              {item.icon && (
                <span className="item-icon">{item.icon}</span>
              )}
              <span className="item-label">{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Export convenience components for compatibility
export const PillDropdownMenuTrigger = PillDropdownMenu;
export const PillDropdownMenuContent = ({ children }: any) => children;
export const PillDropdownMenuItem = ({ children, ...props }: any) => ({ label: children, ...props });
export const PillDropdownMenuSeparator = () => ({ separator: true });