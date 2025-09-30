import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Calendar, ChevronDown } from 'lucide-react';
import './pill-month-filter.css';

interface MonthOption {
  value: string;
  label: string;
}

interface PillMonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthOptions: MonthOption[];
  className?: string;
}

export default function PillMonthFilter({
  selectedMonth,
  onMonthChange,
  monthOptions,
  className = ''
}: PillMonthFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const hoverCircleRef = useRef<HTMLSpanElement>(null);

  // Find the selected month label
  const selectedLabel = monthOptions.find(opt => opt.value === selectedMonth)?.label || 'Select Month';

  useEffect(() => {
    // Initial setup
    if (menuRef.current) {
      gsap.set(menuRef.current, {
        opacity: 0,
        y: -10,
        visibility: 'hidden',
        transformOrigin: 'top center'
      });
    }

    // Entrance animation for the icon
    if (iconRef.current) {
      gsap.fromTo(iconRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.6, ease: 'power3.out', delay: 0.2 }
      );
    }

    // Setup hover circle
    if (hoverCircleRef.current) {
      gsap.set(hoverCircleRef.current, {
        scale: 0,
        xPercent: -50,
        yPercent: -50,
        transformOrigin: 'center center'
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    const icon = buttonRef.current?.querySelector('.chevron-icon');

    if (menu) {
      gsap.set(menu, { visibility: 'visible' });
      gsap.to(menu, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Stagger animation for menu items
      itemRefs.current.forEach((item, index) => {
        if (item) {
          gsap.fromTo(item,
            { opacity: 0, x: -20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.3,
              delay: index * 0.03,
              ease: 'power2.out'
            }
          );
        }
      });
    }

    if (icon) {
      gsap.to(icon, {
        rotation: 180,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    const menu = menuRef.current;
    const icon = buttonRef.current?.querySelector('.chevron-icon');

    if (menu) {
      gsap.to(menu, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(menu, { visibility: 'hidden' });
        }
      });
    }

    if (icon) {
      gsap.to(icon, {
        rotation: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleMonthSelect = (value: string) => {
    onMonthChange(value);
    closeDropdown();

    // Pulse animation on selection
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }
  };

  const handleButtonEnter = () => {
    if (hoverCircleRef.current) {
      gsap.to(hoverCircleRef.current, {
        scale: 1.5,
        duration: 0.4,
        ease: 'power2.out'
      });
    }
  };

  const handleButtonLeave = () => {
    if (hoverCircleRef.current) {
      gsap.to(hoverCircleRef.current, {
        scale: 0,
        duration: 0.3,
        ease: 'power2.in'
      });
    }
  };

  const handleItemEnter = (index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      gsap.to(item, {
        x: 5,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  };

  const handleItemLeave = (index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      gsap.to(item, {
        x: 0,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  };

  return (
    <div className={`pill-month-filter-container ${className}`}>
      <div className="pill-filter-wrapper">
        {/* Icon Badge */}
        <div className="pill-icon-badge" ref={iconRef}>
          <Calendar className="calendar-icon" />
        </div>

        {/* Label */}
        <span className="pill-filter-label">View Data For:</span>

        {/* Dropdown */}
        <div className="pill-dropdown" ref={dropdownRef}>
          <button
            ref={buttonRef}
            className="pill-dropdown-button"
            onClick={toggleDropdown}
            onMouseEnter={handleButtonEnter}
            onMouseLeave={handleButtonLeave}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className="hover-circle" ref={hoverCircleRef} aria-hidden="true" />
            <span className="button-content">
              <span className="selected-value">{selectedLabel}</span>
              <ChevronDown className="chevron-icon" size={16} />
            </span>
          </button>

          <ul
            ref={menuRef}
            className="pill-dropdown-menu"
            role="listbox"
            aria-label="Select month"
          >
            {monthOptions.map((option, index) => (
              <li
                key={option.value}
                ref={el => itemRefs.current[index] = el}
                className={`pill-dropdown-item ${option.value === selectedMonth ? 'is-selected' : ''}`}
                onClick={() => handleMonthSelect(option.value)}
                onMouseEnter={() => handleItemEnter(index)}
                onMouseLeave={() => handleItemLeave(index)}
                role="option"
                aria-selected={option.value === selectedMonth}
              >
                <span className="item-label">{option.label}</span>
                {option.value === selectedMonth && (
                  <span className="selected-indicator" aria-hidden="true">●</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}