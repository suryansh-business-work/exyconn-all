import { describe, it, expect } from 'vitest';
import React from 'react';

/**
 * Basic UI application tests
 * These tests verify that the UI is properly configured and can render
 */
describe('UI Application', () => {
  describe('Environment', () => {
    it('should have Node.js version 20 or higher', () => {
      const nodeVersion = parseInt(process.version.slice(1).split('.')[0], 10);
      expect(nodeVersion).toBeGreaterThanOrEqual(20);
    });

    it('should have React available', () => {
      expect(React).toBeDefined();
      expect(React.version).toBeDefined();
    });

    it('should have React.createElement function', () => {
      expect(typeof React.createElement).toBe('function');
    });
  });

  describe('React Components', () => {
    it('should be able to create a basic React element', () => {
      const element = React.createElement('div', { id: 'test' }, 'Hello World');
      expect(element).toBeDefined();
      expect(element.type).toBe('div');
      expect(element.props.id).toBe('test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((element.props as any).children).toBe('Hello World');
    });

    it('should be able to create a functional component', () => {
      const TestComponent: React.FC<{ message: string }> = ({ message }) => {
        return React.createElement('span', null, message);
      };

      const element = React.createElement(TestComponent, { message: 'Test' });
      expect(element).toBeDefined();
      expect(element.type).toBe(TestComponent);
      expect(element.props.message).toBe('Test');
    });
  });

  describe('Dependencies', () => {
    it('should have react-router-dom available', async () => {
      const routerDom = await import('react-router-dom');
      expect(routerDom).toBeDefined();
      expect(routerDom.BrowserRouter).toBeDefined();
      expect(routerDom.Routes).toBeDefined();
      expect(routerDom.Route).toBeDefined();
    });

    it('should have Material UI available', async () => {
      const mui = await import('@mui/material');
      expect(mui).toBeDefined();
    });
  });

  describe('Build Configuration', () => {
    it('should be running in test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });
});
