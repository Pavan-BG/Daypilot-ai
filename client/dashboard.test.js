import { render, screen } from '@testing-library/react';
import Dashboard from './src/pages/Dashboard.jsx';

test('renders Dashboard page', () => {
  render(<Dashboard />);
  // Add more specific checks based on your component
  expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
});
