import React from 'react';
import { render } from '@testing-library/react';

jest.mock('react-router-dom', () => {
  const React = require('react');
  const MockRoute = ({ element }: any) => element || null;
  return {
    BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    Route: MockRoute,
    Navigate: () => null,
    useNavigate: () => jest.fn(),
  };
});

jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => null,
  Pie: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }: any) => null,
  BarChart: ({ children }: any) => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

jest.mock('jspdf', () => {
  const mock = function () {};
  mock.prototype.save = jest.fn();
  mock.prototype.setFontSize = jest.fn();
  mock.prototype.setFont = jest.fn();
  mock.prototype.text = jest.fn();
  mock.prototype.setDrawColor = jest.fn();
  mock.prototype.setLineWidth = jest.fn();
  mock.prototype.line = jest.fn();
  return { __esModule: true, default: mock };
});

jest.mock('jspdf-autotable', () => jest.fn());

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: { div: 'div' },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Zoom: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('date-fns', () => ({}));
jest.mock('date-fns/locale/fr', () => ({ fr: {} }));
jest.mock('@mui/x-date-pickers/DatePicker', () => ({ DatePicker: () => null }));
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({ LocalizationProvider: ({ children }: any) => null }));
jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({ AdapterDateFns: class {} }));

import App from './App';

test('renders app without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeInTheDocument();
});
