import React from 'react';
import {render} from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    const {getByText} = render(<App />);
    // Just check that the app renders without throwing
    // We can't test much more without mocking navigation
    expect(getByText).toBeDefined();
  });
});
