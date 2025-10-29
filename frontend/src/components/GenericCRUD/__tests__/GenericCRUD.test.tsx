import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockCRUDConfig, mockApiResponse } from '../../../utils/testUtils';
import GenericCRUD from '../GenericCRUD';

// Mock fetch
global.fetch = jest.fn();

describe('GenericCRUD', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    localStorage.setItem('access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders correctly with title and create button', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <GenericCRUD
        title={mockCRUDConfig.title}
        apiEndpoint={mockCRUDConfig.apiEndpoint}
        fieldConfig={mockCRUDConfig.fieldConfig}
        displayFields={mockCRUDConfig.displayFields}
        idField={mockCRUDConfig.idField}
      />
    );

    expect(screen.getByText('Test Items')).toBeInTheDocument();
    expect(screen.getByText('Crear Nuevo')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });
  });

  it('opens create modal when create button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <GenericCRUD
        title={mockCRUDConfig.title}
        apiEndpoint={mockCRUDConfig.apiEndpoint}
        fieldConfig={mockCRUDConfig.fieldConfig}
        displayFields={mockCRUDConfig.displayFields}
        idField={mockCRUDConfig.idField}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Crear Nuevo'));
    
    expect(screen.getByText('Crear Nuevo Test Items')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre *')).toBeInTheDocument();
  });

  it('filters items based on search term', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <GenericCRUD
        title={mockCRUDConfig.title}
        apiEndpoint={mockCRUDConfig.apiEndpoint}
        fieldConfig={mockCRUDConfig.fieldConfig}
        displayFields={mockCRUDConfig.displayFields}
        idField={mockCRUDConfig.idField}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Item 1' } });

    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Item 2')).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Mock window.alert
    window.alert = jest.fn();

    render(
      <GenericCRUD
        title={mockCRUDConfig.title}
        apiEndpoint={mockCRUDConfig.apiEndpoint}
        fieldConfig={mockCRUDConfig.fieldConfig}
        displayFields={mockCRUDConfig.displayFields}
        idField={mockCRUDConfig.idField}
      />
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Error al cargar datos')
      );
    });
  });
});