import { render, screen } from '@testing-library/react';
import App from './src/App.jsx';

test('renders without crashing', () => {
  render(<App />);
  // You can add more specific checks here
  expect(screen).toBeDefined();
});
