import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuCard } from '../MenuCard';
import { MenuItem } from '@shared/schema';

// Mock the useCart hook
vi.mock('@/hooks/use-cart', () => ({
  useCart: vi.fn(),
}));

import { useCart } from '@/hooks/use-cart';

const mockAddItem = vi.fn();
(useCart as any).mockReturnValue(mockAddItem);

const mockItem: MenuItem = {
  id: 1,
  name: 'Margherita Pizza',
  description: 'Classic tomato sauce, fresh mozzarella, and basil.',
  price: 1299,
  imageUrl: 'https://example.com/pizza.jpg',
  category: 'Pizza',
};

describe('MenuCard', () => {
  it('renders menu item details correctly', () => {
    render(<MenuCard item={mockItem} />);

    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('Classic tomato sauce, fresh mozzarella, and basil.')).toBeInTheDocument();
    expect(screen.getByText('$12.99')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByAltText('Margherita Pizza')).toBeInTheDocument();
  });

  it('calls addItem when add button is clicked', () => {
    render(<MenuCard item={mockItem} />);

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith(mockItem);
  });
});