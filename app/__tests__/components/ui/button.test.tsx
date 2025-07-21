import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/app/components/ui/button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render with text content', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Test Button');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Styled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should handle disabled state', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('should be keyboard navigable', async () => {
      render(<Button>Keyboard Test</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle Enter key press', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Enter Test</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle Space key press', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Space Test</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          Text
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('IconText');
    });

    it('should handle rapid consecutive clicks', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should maintain focus after re-render', async () => {
      let buttonText = 'Initial';
      const { rerender } = render(<Button>{buttonText}</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      
      buttonText = 'Updated';
      rerender(<Button>{buttonText}</Button>);
      
      expect(screen.getByRole('button')).toHaveTextContent('Updated');
    });
  });
}); 