/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CompleteAccountSetup from '../../pages/CompleteAccountSetup';
import api from '../../utils/api';

// persistent mock
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ inviteToken: 'valid-token' }),
}));

jest.mock('../../utils/api');

const renderWithRouter = (ui: JSX.Element) =>
  render(
    <MemoryRouter initialEntries={['/complete-setup/valid-token']}>
      <Routes>
        <Route path="/complete-setup/:inviteToken" element={ui} />
      </Routes>
    </MemoryRouter>
  );

describe('CompleteAccountSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithRouter(<CompleteAccountSetup />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays user details after successful data fetch', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date().toISOString(),
      },
    });

    const { container } = renderWithRouter(<CompleteAccountSetup />);

    // wait until the form’s password inputs appear
    await waitFor(() => {
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      expect(container.querySelectorAll('input[type="password"]')).toHaveLength(2);
    });

    // Now assert email and name separately
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays an error message if the invite is expired', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        email: 'expired@example.com',
        firstName: 'Expired',
        lastName: 'User',
        createdAt: new Date(Date.now() - 31 * 24 * 3600 * 1000).toISOString(),
      },
    });

    renderWithRouter(<CompleteAccountSetup />);
    expect(await screen.findByText(/this invite has expired/i)).toBeInTheDocument();
  });

  it('handles password mismatch error', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        createdAt: new Date().toISOString(),
      },
    });

    const { container } = renderWithRouter(<CompleteAccountSetup />);

    await waitFor(() => {
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      expect(container.querySelectorAll('input[type="password"]')).toHaveLength(2);
    });

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const [pwdInput, confirmInput] = Array.from(
      container.querySelectorAll('input[type="password"]')
    );
    await userEvent.type(pwdInput, 'password123');
    await userEvent.type(confirmInput, 'password321');
    await userEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('submits the form successfully and redirects on valid input', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date().toISOString(),
      },
    });
    (api.post as jest.Mock).mockResolvedValueOnce({});

    const { container } = renderWithRouter(<CompleteAccountSetup />);

    await waitFor(() => {
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      expect(container.querySelectorAll('input[type="password"]')).toHaveLength(2);
    });

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const [pwdInput, confirmInput] = Array.from(
      container.querySelectorAll('input[type="password"]')
    );
    await userEvent.type(pwdInput, 'password123');
    await userEvent.type(confirmInput, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('displays an error message if the API call fails', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date().toISOString(),
      },
    });
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const { container } = renderWithRouter(<CompleteAccountSetup />);

    await waitFor(() => {
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      expect(container.querySelectorAll('input[type="password"]')).toHaveLength(2);
    });

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const [pwdInput, confirmInput] = Array.from(
      container.querySelectorAll('input[type="password"]')
    );
    await userEvent.type(pwdInput, 'password123');
    await userEvent.type(confirmInput, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    expect(
      await screen.findByText(/failed to complete account setup/i)
    ).toBeInTheDocument();
  });
});
