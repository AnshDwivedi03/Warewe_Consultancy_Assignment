/**
 * Core Email Verification Module
 * Validates email syntax, detects typos, performs DNS MX lookup,
 * and checks SMTP mailbox existence.
 * Made by Ansh
 */

const dns = require('dns');
const net = require('net');
const DOMAIN_TYPO_MAP = require('./typoMap');

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validate email syntax using regex
 * @param {string} email
 * @returns {{ valid: boolean, reason: string|null }}
 */
function validateSyntax(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email is empty or not a string' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'Email is empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, reason: 'Email exceeds maximum length of 254 characters' };
  }

  // Check for multiple @ symbols
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) {
    return { valid: false, reason: 'Missing @ symbol' };
  }
  if (atCount > 1) {
    return { valid: false, reason: 'Multiple @ symbols found' };
  }

  // Check for double dots
  if (trimmed.includes('..')) {
    return { valid: false, reason: 'Double dots are not allowed' };
  }

  // Check starts/ends with dot
  const [localPart, domainPart] = trimmed.split('@');
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, reason: 'Local part cannot start or end with a dot' };
  }

  if (!domainPart || domainPart.length === 0) {
    return { valid: false, reason: 'Domain part is missing' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  return { valid: true, reason: null };
}

/**
 * Check for common domain typos
 * @param {string} domain
 * @returns {string|null} Suggested correct domain, or null if no typo
 */
function checkTypo(domain) {
  const lower = domain.toLowerCase();
  return DOMAIN_TYPO_MAP[lower] || null;
}

/**
 * Perform DNS MX record lookup
 * @param {string} domain
 * @returns {Promise<string[]>} Array of MX record hostnames
 */
function getMxRecords(domain) {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) return reject(err);
      if (!addresses || addresses.length === 0) {
        return reject(new Error('No MX records found'));
      }
      // Sort by priority (lower = higher priority)
      addresses.sort((a, b) => a.priority - b.priority);
      resolve(addresses.map((a) => a.exchange));
    });
  });
}

/**
 * Perform SMTP check by connecting to mail server and issuing RCPT TO
 * @param {string} mxHost - The MX server hostname
 * @param {string} email - The email to verify
 * @param {number} timeout - Connection timeout in ms
 * @returns {Promise<{ code: number, response: string }>}
 */
function checkSmtp(mxHost, email, timeout = 10000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let step = 0;
    let resolved = false;

    const finish = (code, response) => {
      if (!resolved) {
        resolved = true;
        socket.removeAllListeners();
        socket.destroy();
        resolve({ code, response });
      }
    };

    socket.setTimeout(timeout);

    socket.on('data', (data) => {
      const response = data.toString();
      const code = parseInt(response.substring(0, 3), 10);

      switch (step) {
        case 0: // Greeting
          if (code === 220) {
            step++;
            socket.write('EHLO verify.local\r\n');
          } else {
            finish(code, response.trim());
          }
          break;

        case 1: // EHLO response
          if (code === 250) {
            step++;
            socket.write('MAIL FROM:<verify@verify.local>\r\n');
          } else {
            finish(code, response.trim());
          }
          break;

        case 2: // MAIL FROM response
          if (code === 250) {
            step++;
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else {
            finish(code, response.trim());
          }
          break;

        case 3: // RCPT TO response - this is the key response
          socket.write('QUIT\r\n');
          finish(code, response.trim());
          break;

        default:
          finish(code, response.trim());
      }
    });

    socket.on('timeout', () => {
      finish(0, 'Connection timed out');
    });

    socket.on('error', (err) => {
      finish(0, err.message);
    });

    socket.connect(25, mxHost);
  });
}

/**
 * Main email verification function
 * @param {*} email - Email address to verify
 * @returns {Promise<Object>} Structured verification result
 */
async function verifyEmail(email) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const KICKBOX_API_KEY = process.env.KICKBOX_API_KEY;

  // Build base result
  const result = {
    email: email,
    result: 'unknown',
    resultcode: 3,
    subresult: 'unknown',
    domain: null,
    mxRecords: [],
    executiontime: 0,
    error: null,
    timestamp,
  };

  try {
    // Step 1: Validate syntax
    const syntaxCheck = validateSyntax(email);
    if (!syntaxCheck.valid) {
      result.result = 'invalid';
      result.resultcode = 6;
      result.subresult = 'syntax_error';
      result.error = syntaxCheck.reason;
      result.executiontime = (Date.now() - startTime) / 1000;
      return result;
    }

    const trimmed = email.trim();
    const [, domain] = trimmed.split('@');
    result.domain = domain;

    // IF API KEY IS PROVIDED, USE KICKBOX API
    if (KICKBOX_API_KEY) {
      try {
        const apiUrl = `https://api.kickbox.com/v2/verify?email=${encodeURIComponent(trimmed)}&apikey=${KICKBOX_API_KEY}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success === false) {
          throw new Error(data.message || 'Kickbox API error');
        }

        // Map Kickbox API response to our internal format
        result.mxRecords = ['(Verified via API)'];
        
        if (data.did_you_mean && data.did_you_mean !== trimmed) {
          result.result = 'invalid';
          result.resultcode = 6;
          result.subresult = 'typo_detected';
          result.didyoumean = data.did_you_mean;
        } else if (data.result === 'deliverable') {
          result.result = 'valid';
          result.resultcode = 1;
          result.subresult = 'mailbox_exists';
        } else if (data.result === 'undeliverable') {
          result.result = 'invalid';
          result.resultcode = 6;
          result.subresult = 'mailbox_does_not_exist';
        } else {
          result.result = 'unknown';
          result.resultcode = 3;
          result.subresult = 'unknown';
        }

        result.executiontime = (Date.now() - startTime) / 1000;
        return result;
      } catch (apiError) {
        console.warn('Kickbox API failed:', apiError.message);
        result.error = `Kickbox API failed: ${apiError.message}. (Falling back to manual SMTP check)`;
        // Fall through to manual check if API fails
      }
    }

    // FALLBACK TO MANUAL SMTP CHECK (May fail on cloud providers)
    
    // Step 2: Check for typos
    const suggestedDomain = checkTypo(domain);
    if (suggestedDomain) {
      const [localPart] = trimmed.split('@');
      result.result = 'invalid';
      result.resultcode = 6;
      result.subresult = 'typo_detected';
      result.didyoumean = `${localPart}@${suggestedDomain}`;
      result.executiontime = (Date.now() - startTime) / 1000;
      return result;
    }

    // Step 3: DNS MX lookup
    let mxRecords;
    try {
      mxRecords = await getMxRecords(domain);
      result.mxRecords = mxRecords;
    } catch (dnsError) {
      result.result = 'invalid';
      result.resultcode = 6;
      result.subresult = 'no_mx_records';
      result.error = `DNS lookup failed: ${dnsError.message}`;
      result.executiontime = (Date.now() - startTime) / 1000;
      return result;
    }

    // Step 4: SMTP check
    let smtpResult;
    try {
      smtpResult = await checkSmtp(mxRecords[0], trimmed);
    } catch (smtpError) {
      result.result = 'unknown';
      result.resultcode = 3;
      result.subresult = 'connection_error';
      result.error = `SMTP check failed: ${smtpError.message} (Note: Port 25 is often blocked on cloud hosting)`;
      result.executiontime = (Date.now() - startTime) / 1000;
      return result;
    }

    // Interpret SMTP response code
    const smtpCode = smtpResult.code;

    if (smtpCode === 250) {
      result.result = 'valid';
      result.resultcode = 1;
      result.subresult = 'mailbox_exists';
    } else if (smtpCode === 550 || smtpCode === 551 || smtpCode === 552 || smtpCode === 553) {
      result.result = 'invalid';
      result.resultcode = 6;
      result.subresult = 'mailbox_does_not_exist';
    } else if (smtpCode === 450 || smtpCode === 451 || smtpCode === 452) {
      result.result = 'unknown';
      result.resultcode = 3;
      result.subresult = 'greylisted';
    } else if (smtpCode === 0) {
      result.result = 'unknown';
      result.resultcode = 3;
      result.subresult = 'connection_error';
      result.error = smtpResult.response;
    } else {
      result.result = 'unknown';
      result.resultcode = 3;
      result.subresult = 'unexpected_response';
      result.error = `SMTP code ${smtpCode}: ${smtpResult.response}`;
    }
  } catch (err) {
    result.result = 'unknown';
    result.resultcode = 3;
    result.subresult = 'internal_error';
    result.error = err.message;
  }

  result.executiontime = (Date.now() - startTime) / 1000;
  return result;
}

// Export functions for testing and usage
module.exports = {
  verifyEmail,
  validateSyntax,
  checkTypo,
  getMxRecords,
  checkSmtp,
};
