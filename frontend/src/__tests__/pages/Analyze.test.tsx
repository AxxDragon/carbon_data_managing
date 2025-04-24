/* eslint-disable testing-library/prefer-find-by */

import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Analyze from '../../pages/Analyze';
import api from '../../utils/api';
import { renderWithAuthOnly } from '../../../test-utils/testUtils';

// 1) Polyfill ResizeObserver for Recharts' ResponsiveContainer
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(global as any).ResizeObserver = ResizeObserver;

// Mock the API module
jest.mock('../../utils/api');

describe('Analyze Page', () => {
  const fakeProjects = [
    { id: 1, name: 'Project One', companyId: 10 },
    { id: 2, name: 'Project Two', companyId: 20 },
  ];
  const fakeCompanies = [
    { id: 10, name: 'Acme Corp' },
    { id: 20, name: 'Globex Inc' },
  ];
  const fakeFuelTypes = [
    { id: 1, averageCO2Emission: 2.5 },
    { id: 2, averageCO2Emission: 4.0 },
  ];
  const fakeConsumption = [
    {
      startDate: '2025-04-01',
      endDate: '2025-04-01',
      fuelTypeId: 1,
      fuelType: 'Gas',
      amount: 10,
      project: 'Project One',
      averageCO2Emission: 2.5,
    },
    {
      startDate: '2025-04-02',
      endDate: '2025-04-02',
      fuelTypeId: 2,
      fuelType: 'Diesel',
      amount: 8,
      project: 'Project One',
      averageCO2Emission: 4.0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((url: string) => {
      switch (url) {
        case 'projects':
          return Promise.resolve({ data: fakeProjects });
        case 'options/companies':
          return Promise.resolve({ data: fakeCompanies });
        case 'options/fuel-types':
          return Promise.resolve({ data: fakeFuelTypes });
        case 'consumption':
          return Promise.resolve({ data: fakeConsumption });
        default:
          return Promise.reject(new Error('Unmocked URL: ' + url));
      }
    });
  });

  it('renders a combined list of companies + projects', async () => {
    // Render as admin so companies appear too
    renderWithAuthOnly(<Analyze />, { userOverrides: { role: 'admin' } });

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(fakeCompanies.length + fakeProjects.length);

    // Companies still include the "Company – " prefix
    fakeCompanies.forEach(c =>
      expect(screen.getByText(`Company - ${c.name}`)).toBeInTheDocument()
    );

    // Projects, however, we allow any containing "Project One"
    expect(screen.getByText(/Project One/)).toBeInTheDocument();
    expect(screen.getByText(/Project Two/)).toBeInTheDocument();
  });

  it('filters the list based on the search term', async () => {
    renderWithAuthOnly(<Analyze />, { userOverrides: { role: 'admin' } });

    // wait for initial list to appear
    await screen.findAllByRole('listitem');

    const input = screen.getByPlaceholderText(/search projects\/companies/i);
    await userEvent.type(input, 'One');

    const filtered = await screen.findAllByRole('listitem');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toHaveTextContent('Project One');
  });

  it('fetches and displays chart controls when a project is clicked', async () => {
    renderWithAuthOnly(<Analyze />);

    // Project-only list shows 2 items
    await screen.findAllByRole('listitem');

    fireEvent.click(screen.getByText('Project One'));

    // Back button + heading
    expect(await screen.findByRole('button', { name: /← Back/i })).toBeInTheDocument();
    expect(screen.getByText(/Project One Analysis/i)).toBeInTheDocument();

    // Checkboxes for each fuel type + Total CO₂
    expect(screen.getByLabelText(/Gas/)).toBeChecked();
    expect(screen.getByLabelText(/Diesel/)).toBeChecked();
    expect(screen.getByLabelText(/Total CO₂/)).toBeChecked();
  });
});
