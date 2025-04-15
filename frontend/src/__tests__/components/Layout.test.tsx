import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../context/AuthContext';
import { User } from '../../context/AuthContext';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div>Mocked Outlet Content</div>,
}));

const mockUser: User = {
  id: 1,
  email: 'layoutuser@example.com',
  role: 'user', // <- must match the union type: "user" | "companyadmin" | "admin"
  companyId: 1,
  token: 'mocked-token',
};

describe('Layout', () => {
  it('renders Header, Footer, and Outlet', () => {
    render(
      <AuthContext.Provider
        value={{
          user: mockUser,
          login: jest.fn(),
          logout: jest.fn(),
          updateToken: jest.fn(), // <- fix for missing required prop
        }}
      >
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Check outlet content
    expect(screen.getByText("Mocked Outlet Content")).toBeInTheDocument();

    // Check header
    expect(screen.getByText("CARMA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /layoutuser@example\.com/i })).toBeInTheDocument();

    // Check footer elements that do exist
    expect(screen.getByText(/impressum/i)).toBeInTheDocument();
    expect(screen.getByText(/agb/i)).toBeInTheDocument();
  });
});
