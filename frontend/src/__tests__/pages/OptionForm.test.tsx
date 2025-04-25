import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OptionForm from '../../pages/OptionForm';
import api from '../../utils/api';

jest.mock('../../utils/api');

describe('OptionForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form for creating a new Company', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();

    render(
      <OptionForm
        category="Companies"
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText(/Name:/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Average CO2 Emission/i)
    ).not.toBeInTheDocument();
  });

  it('renders form for editing a Fuel Type with CO2 emission field', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const option = { id: 1, name: 'Diesel', averageCO2Emission: 2.68 };

    render(
      <OptionForm
        category="Fuel Types"
        option={option}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // pre-filled values
    expect(screen.getByLabelText(/Name:/i)).toHaveValue('Diesel');
    expect(screen.getByLabelText(/Average CO2 Emission/i)).toHaveValue(2.68);
  });

  it('submits form to create a new Unit', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    (api.post as jest.Mock).mockResolvedValueOnce({});

    render(
      <OptionForm
        category="Units"
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // fill in the "Name" field
    fireEvent.change(screen.getByLabelText(/Name:/i), {
      target: { value: 'Kilograms' },
    });

    // submit
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/options/units',
        { name: 'Kilograms' }
      )
    );

    expect(onSave).toHaveBeenCalled();
  });

  it('submits form to update an existing Fuel Type via PUT', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const existing = { id: 42, name: 'Petrol', averageCO2Emission: 2.5 };
    (api.put as jest.Mock).mockResolvedValueOnce({});

    render(
      <OptionForm
        category="Fuel Types"
        option={existing}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // change name and emission
    fireEvent.change(screen.getByLabelText(/Name:/i), {
      target: { value: 'Petrol Prime' },
    });
    fireEvent.change(screen.getByLabelText(/Average CO2 Emission/i), {
      target: { value: '3.14' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/options/fuel-types/42',
        { name: 'Petrol Prime', averageCO2Emission: 3.14 }
      );
    });

    expect(onSave).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();

    render(
      <OptionForm
        category="Companies"
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
