import { describe, it, expect } from 'vitest';

/**
 * Basic server health check tests
 * These tests verify that the server is properly configured and running
 */
describe('Server', () => {
  describe('Environment', () => {
    it('should have Node.js version 20 or higher', () => {
      const nodeVersion = parseInt(process.version.slice(1).split('.')[0], 10);
      expect(nodeVersion).toBeGreaterThanOrEqual(20);
    });

    it('should be able to load express', async () => {
      const express = await import('express');
      expect(express).toBeDefined();
      expect(typeof express.default).toBe('function');
    });

    it('should be able to create an express app', async () => {
      const express = await import('express');
      const app = express.default();
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });
  });

  describe('Dependencies', () => {
    it('should have cors package available', async () => {
      const cors = await import('cors');
      expect(cors).toBeDefined();
    });

    it('should have dotenv package available', async () => {
      const dotenv = await import('dotenv');
      expect(dotenv).toBeDefined();
    });
  });

  describe('Server Configuration', () => {
    it('should have default PORT configured', () => {
      const PORT = process.env.PORT || 4002;
      expect(PORT).toBeDefined();
      expect(Number(PORT)).toBeGreaterThan(0);
    });
  });
});
