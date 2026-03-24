/**
 * Email Verification Module - Unit Tests
 * 20+ comprehensive test cases covering syntax, SMTP, typos, and edge cases.
 * Made by Ansh
 */

const { verifyEmail, validateSyntax, checkTypo } = require('../src/verifyEmail');
const dns = require('dns');
const net = require('net');

// Mock dns and net modules for deterministic testing
jest.mock('dns');
jest.mock('net');

// Helper to create a mock socket
function createMockSocket(smtpCode = 250) {
  const handlers = {};
  const socket = {
    setTimeout: jest.fn(),
    write: jest.fn(),
    destroy: jest.fn(),
    removeAllListeners: jest.fn(),
    connect: jest.fn(function () {
      // Simulate SMTP greeting
      setTimeout(() => {
        if (handlers['data']) handlers['data'](Buffer.from('220 mail.example.com ESMTP\r\n'));
      }, 10);
    }),
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    }),
    // Expose handlers for testing
    _trigger: (event, data) => {
      if (handlers[event]) handlers[event](data);
    },
  };

  // Simulate full SMTP conversation when write is called
  let step = 0;
  socket.write.mockImplementation((data) => {
    const cmd = data.toString();
    setTimeout(() => {
      if (cmd.startsWith('EHLO')) {
        handlers['data'](Buffer.from('250 OK\r\n'));
      } else if (cmd.startsWith('MAIL FROM')) {
        handlers['data'](Buffer.from('250 OK\r\n'));
      } else if (cmd.startsWith('RCPT TO')) {
        handlers['data'](Buffer.from(`${smtpCode} Response\r\n`));
      }
    }, 10);
  });

  return socket;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================
// PART 1: Syntax Validation Tests
// =============================================================

describe('Syntax Validation', () => {
  test('1. Valid standard email passes validation', () => {
    const result = validateSyntax('user@example.com');
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
  });

  test('2. Valid email with dots in local part', () => {
    const result = validateSyntax('first.last@example.com');
    expect(result.valid).toBe(true);
  });

  test('3. Valid email with plus addressing', () => {
    const result = validateSyntax('user+tag@example.com');
    expect(result.valid).toBe(true);
  });

  test('4. Invalid email — missing @ symbol', () => {
    const result = validateSyntax('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing @ symbol');
  });

  test('5. Invalid email — double dots in domain', () => {
    const result = validateSyntax('user@exam..ple.com');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Double dots');
  });

  test('6. Invalid email — starts with dot', () => {
    const result = validateSyntax('.user@example.com');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('start or end with a dot');
  });

  test('7. Invalid email — no domain part', () => {
    const result = validateSyntax('user@');
    expect(result.valid).toBe(false);
  });

  test('8. Invalid email — no local part', () => {
    const result = validateSyntax('@example.com');
    expect(result.valid).toBe(false);
  });

  test('9. Invalid email — multiple @ symbols', () => {
    const result = validateSyntax('user@@example.com');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Multiple @ symbols');
  });
});

// =============================================================
// PART 2: Typo Detection Tests
// =============================================================

describe('Typo Detection', () => {
  test('10. Detects gmail.co → gmail.com typo', () => {
    expect(checkTypo('gmail.co')).toBe('gmail.com');
  });

  test('11. Detects gmai.com → gmail.com typo', () => {
    expect(checkTypo('gmai.com')).toBe('gmail.com');
  });

  test('12. Detects hotmal.com → hotmail.com typo', () => {
    expect(checkTypo('hotmal.com')).toBe('hotmail.com');
  });

  test('13. Detects yahooo.com → yahoo.com typo', () => {
    expect(checkTypo('yahooo.com')).toBe('yahoo.com');
  });

  test('14. No typo for valid domain (gmail.com)', () => {
    expect(checkTypo('gmail.com')).toBeNull();
  });

  test('15. Detects outlok.com → outlook.com typo', () => {
    expect(checkTypo('outlok.com')).toBe('outlook.com');
  });
});

// =============================================================
// PART 3: Full Verification (with DNS/SMTP mocking)
// =============================================================

describe('Full Email Verification', () => {
  test('16. Typo detected returns invalid with didyoumean suggestion', async () => {
    const result = await verifyEmail('user@gmai.com');
    expect(result.result).toBe('invalid');
    expect(result.subresult).toBe('typo_detected');
    expect(result.didyoumean).toBe('user@gmail.com');
    expect(result.resultcode).toBe(6);
  });

  test('17. Valid email with SMTP 250 returns valid/mailbox_exists', async () => {
    // Mock DNS
    dns.resolveMx.mockImplementation((domain, cb) => {
      cb(null, [{ exchange: 'mx.example.com', priority: 10 }]);
    });

    // Mock net.Socket
    const mockSocket = createMockSocket(250);
    net.Socket.mockImplementation(() => mockSocket);

    const result = await verifyEmail('user@example.com');
    expect(result.result).toBe('valid');
    expect(result.resultcode).toBe(1);
    expect(result.subresult).toBe('mailbox_exists');
    expect(result.mxRecords).toContain('mx.example.com');
    expect(result.domain).toBe('example.com');
  });

  test('18. SMTP 550 error returns invalid/mailbox_does_not_exist', async () => {
    dns.resolveMx.mockImplementation((domain, cb) => {
      cb(null, [{ exchange: 'mx.example.com', priority: 10 }]);
    });

    const mockSocket = createMockSocket(550);
    net.Socket.mockImplementation(() => mockSocket);

    const result = await verifyEmail('nonexistent@example.com');
    expect(result.result).toBe('invalid');
    expect(result.resultcode).toBe(6);
    expect(result.subresult).toBe('mailbox_does_not_exist');
  });

  test('19. SMTP 450 error returns unknown/greylisted', async () => {
    dns.resolveMx.mockImplementation((domain, cb) => {
      cb(null, [{ exchange: 'mx.example.com', priority: 10 }]);
    });

    const mockSocket = createMockSocket(450);
    net.Socket.mockImplementation(() => mockSocket);

    const result = await verifyEmail('greylisted@example.com');
    expect(result.result).toBe('unknown');
    expect(result.resultcode).toBe(3);
    expect(result.subresult).toBe('greylisted');
  });

  test('20. SMTP connection timeout returns unknown/connection_error', async () => {
    dns.resolveMx.mockImplementation((domain, cb) => {
      cb(null, [{ exchange: 'mx.example.com', priority: 10 }]);
    });

    // Mock socket that triggers timeout
    const handlers = {};
    const mockSocket = {
      setTimeout: jest.fn(),
      write: jest.fn(),
      destroy: jest.fn(),
      removeAllListeners: jest.fn(),
      connect: jest.fn(function () {
        setTimeout(() => {
          if (handlers['timeout']) handlers['timeout']();
        }, 10);
      }),
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
      }),
    };
    net.Socket.mockImplementation(() => mockSocket);

    const result = await verifyEmail('timeout@example.com');
    expect(result.result).toBe('unknown');
    expect(result.resultcode).toBe(3);
    expect(result.subresult).toBe('connection_error');
  });

  test('21. DNS lookup failure returns invalid/no_mx_records', async () => {
    dns.resolveMx.mockImplementation((domain, cb) => {
      cb(new Error('ENOTFOUND'), null);
    });

    const result = await verifyEmail('user@nonexistentdomain12345.com');
    expect(result.result).toBe('invalid');
    expect(result.resultcode).toBe(6);
    expect(result.subresult).toBe('no_mx_records');
    expect(result.error).toContain('DNS lookup failed');
  });
});

// =============================================================
// PART 4: Edge Cases
// =============================================================

describe('Edge Cases', () => {
  test('22. Empty string returns invalid', async () => {
    const result = await verifyEmail('');
    expect(result.result).toBe('invalid');
    expect(result.subresult).toBe('syntax_error');
  });

  test('23. Null value returns invalid', async () => {
    const result = await verifyEmail(null);
    expect(result.result).toBe('invalid');
    expect(result.subresult).toBe('syntax_error');
  });

  test('24. Undefined value returns invalid', async () => {
    const result = await verifyEmail(undefined);
    expect(result.result).toBe('invalid');
    expect(result.subresult).toBe('syntax_error');
  });

  test('25. Very long email (>254 chars) returns invalid', async () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    const result = await verifyEmail(longEmail);
    expect(result.result).toBe('invalid');
    expect(result.subresult).toBe('syntax_error');
    expect(result.error).toContain('maximum length');
  });

  test('26. Multiple @ symbols returns invalid', async () => {
    const result = await verifyEmail('user@domain@example.com');
    expect(result.result).toBe('invalid');
    expect(result.subresult).toBe('syntax_error');
    expect(result.error).toContain('Multiple @ symbols');
  });

  test('27. Result includes execution time', async () => {
    const result = await verifyEmail('test@gmai.com');
    expect(result.executiontime).toBeDefined();
    expect(typeof result.executiontime).toBe('number');
  });

  test('28. Result includes timestamp', async () => {
    const result = await verifyEmail('test@gmai.com');
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
