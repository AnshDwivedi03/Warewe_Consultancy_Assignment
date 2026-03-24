/**
 * Common email domain typo mappings
 * Maps frequently mistyped domains to their correct counterparts.
 * Made by Ansh
 */

const DOMAIN_TYPO_MAP = {
  // Gmail typos
  'gmail.co': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gimail.com': 'gmail.com',

  // Yahoo typos
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',

  // Hotmail typos
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hitmail.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotamil.com': 'hotmail.com',

  // Outlook typos
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlokk.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlool.com': 'outlook.com',
  'outook.com': 'outlook.com',

  // Other common typos
  'protonmal.com': 'protonmail.com',
  'protonmai.com': 'protonmail.com',
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
};

module.exports = DOMAIN_TYPO_MAP;
