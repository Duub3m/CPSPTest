import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './Login';

// Mock image imports to avoid import errors
jest.mock('./assets/images/Single_Sign_On_Login_Hello.jpg', () => 'hello.jpg');
jest.mock('./assets/images/UA_logo3.gif', () => 'ua-logo.gif');

jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('Login Component', () => {
  test('renders login page elements', () => {
    render(<Login />);

    expect(screen.getByPlaceholderText(/NetID/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });
});
