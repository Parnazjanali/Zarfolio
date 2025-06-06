import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewCustomerPage from './NewCustomerPage';

// Mock react-icons/fa as they are not essential for this smoke test
// and might cause rendering issues or warnings in a JSDOM environment.
// Using vi.mock for Vitest compatibility, or jest.mock for Jest.
// Assuming a Vitest/Jest compatible environment.
vi.mock('react-icons/fa', async (importOriginal) => {
  const actual = await importOriginal(); // Get actual exports
  return {
    ...actual, // Spread actual exports
    FaPlus: () => <span data-testid="fa-plus-icon" />,
    FaTrashAlt: () => <span data-testid="fa-trash-alt-icon" />,
    // Add any other icons used in NewCustomerPage if they cause issues
  };
});

// Mock AddGroupModal as it's a separate component and not the focus of this smoke test.
// This helps to isolate the NewCustomerPage component.
vi.mock('../components/AddGroupModal', () => ({
  __esModule: true, // This is important for ES modules
  default: ({ isOpen, onClose, onAddNewGroup, existingGroups, onDeleteGroup }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="add-group-modal">
        Mock AddGroupModal
        <button onClick={onClose}>Close</button>
        <button onClick={() => onAddNewGroup('Test Group')}>Add Group</button>
      </div>
    );
  },
}));


describe('NewCustomerPage', () => {
  it('renders the main heading of the page', () => {
    render(
      <MemoryRouter>
        <NewCustomerPage />
      </MemoryRouter>
    );

    // Check for the main heading text.
    // Using a regex for flexibility with potential extra spaces or slight variations.
    // The text is "● افزودن طرف حساب / مشتری جدید ●"
    const headingElement = screen.getByText(/افزودن طرف حساب \/ مشتری جدید/i);
    expect(headingElement).toBeInTheDocument();

    // Optionally, check for another key element to be more confident
    const accountCodeLabel = screen.getByLabelText('کد حساب');
    expect(accountCodeLabel).toBeInTheDocument();

    const nameLabel = screen.getByLabelText('نام');
    expect(nameLabel).toBeInTheDocument();
  });

  it('renders balance input fields', () => {
    render(
      <MemoryRouter>
        <NewCustomerPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/مانده حساب مالی \(ریال\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/مانده حساب طلایی \(گرم\)/i)).toBeInTheDocument();
  });

  // Add more basic rendering checks if needed, e.g., for key buttons
  it('renders key action buttons', () => {
    render(
      <MemoryRouter>
        <NewCustomerPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /ثبت شود/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /لیست طرف حساب\/مشتری/i })).toBeInTheDocument();
  });

});

// Note: To run this test, the project would need:
// 1. A test runner like Vitest or Jest.
// 2. `@testing-library/react` and `@testing-library/jest-dom` (for `toBeInTheDocument`).
// 3. Configuration for the test runner (e.g., `vite.config.js` for Vitest, or `jest.config.js`).
// 4. Potentially a setup file for tests (e.g., to globally mock `localStorage` or other browser APIs if needed for more complex tests).
// 5. Add a "test" script to package.json, e.g., "test": "vitest" or "test": "jest".
