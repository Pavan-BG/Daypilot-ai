import { render, screen } from '@testing-library/react';
import DayPlanPanel from './src/components/DayPlanPanel.jsx';

test('renders DayPlanPanel', () => {
  render(<DayPlanPanel />);
  // Add more specific checks based on your component
  expect(screen.getByTestId('dayplan-panel')).toBeInTheDocument();
});
