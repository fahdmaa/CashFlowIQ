import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ChevronDown, Check } from 'lucide-react';
import './pill-select.css';

interface PillSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PillSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: PillSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PillSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  label,
  error,
  required = false,
  size = 'md'
}: PillSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const hoverCircleRef = useRef<HTMLSpanElement>(null);

  // Find the selected option
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

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
    if (disabled) return;

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
              delay: index * 0.02,
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

  const handleOptionSelect = (optionValue: string) => {
    onValueChange(optionValue);
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
    if (disabled) return;
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
    <div className={`pill-select-container ${className}`}>
      {label && (
        <label className="pill-select-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      <div className={`pill-select pill-select-${size} ${disabled ? 'is-disabled' : ''} ${error ? 'has-error' : ''}`} ref={dropdownRef}>
        <button
          ref={buttonRef}
          className="pill-select-button"
          onClick={toggleDropdown}
          onMouseEnter={handleButtonEnter}
          onMouseLeave={handleButtonLeave}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={label || 'Select option'}
          type="button"
        >
          <span className="hover-circle" ref={hoverCircleRef} aria-hidden="true" />
          <span className="button-content">
            {selectedOption?.icon && (
              <span className="option-icon">{selectedOption.icon}</span>
            )}
            <span className={`selected-value ${!value ? 'is-placeholder' : ''}`}>
              {displayValue}
            </span>
            <ChevronDown className="chevron-icon" size={16} />
          </span>
        </button>

        <ul
          ref={menuRef}
          className="pill-select-menu"
          role="listbox"
          aria-label={label || 'Options'}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              ref={el => itemRefs.current[index] = el}
              className={`pill-select-item ${option.value === value ? 'is-selected' : ''}`}
              onClick={() => handleOptionSelect(option.value)}
              onMouseEnter={() => handleItemEnter(index)}
              onMouseLeave={() => handleItemLeave(index)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.icon && (
                <span className="item-icon">{option.icon}</span>
              )}
              <span className="item-label">{option.label}</span>
              {option.value === value && (
                <Check className="selected-icon" size={14} />
              )}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <span className="pill-select-error">{error}</span>
      )}
    </div>
  );
}

// Export convenience components for common use cases
export function PillSelectTrigger({ children, ...props }: any) {
  return <PillSelect {...props}>{children}</PillSelect>;
}

export function PillSelectContent({ children }: any) {
  return <>{children}</>;
}

export function PillSelectItem({ value, children, ...props }: any) {
  return { value, label: children, ...props };
}

export function PillSelectValue({ placeholder }: any) {
  return placeholder;
}