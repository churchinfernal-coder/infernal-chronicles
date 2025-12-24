import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIImageGenerator from './AIImageGenerator';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client', () => {
  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: mockGallery, error: null }),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: null }),
  }));
  return {
    __esModule: true,
    supabase: {
      from: mockFrom,
      functions: {
        invoke: jest.fn().mockResolvedValue({ data: { imageUrl: 'https://example.com/gen.png', prompt: 'Enhanced prompt' }, error: null })
      }
    }
  };
});

const mockGallery = [
  {
    id: '1',
    prompt: 'A wizard in a forest',
    image_url: 'https://example.com/image1.png',
    style: 'fantasy',
    created_at: '2025-10-22T12:00:00Z',
  },
];

describe('AIImageGenerator CRUD', () => {
  beforeEach(() => {
    // No need to reassign supabase properties, handled by jest.mock above
  });

  it('renders and loads gallery', async () => {
    render(<AIImageGenerator />);
    expect(screen.getByText(/AI Image Generator/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Image Gallery/i)).toBeInTheDocument());
    expect(screen.getByText(/A wizard in a forest/i)).toBeInTheDocument();
  });

  it('generates image on prompt', async () => {
    render(<AIImageGenerator />);
    fireEvent.change(screen.getByPlaceholderText(/Describe the image/i), { target: { value: 'A dragon' } });
    fireEvent.click(screen.getByText(/Generate/i));
    await waitFor(() => expect(screen.getByText(/Image generated successfully/i)).toBeInTheDocument());
    expect(screen.getByAltText(/Generated/i)).toBeInTheDocument();
  });

  it('deletes image from gallery', async () => {
    render(<AIImageGenerator />);
    await waitFor(() => expect(screen.getByText(/A wizard in a forest/i)).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    await waitFor(() => expect(screen.getByText(/Image deleted/i)).toBeInTheDocument());
  });
});
