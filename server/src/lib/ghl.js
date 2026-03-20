const axios = require('axios');

const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';

function getHeaders() {
  const key = process.env.GHL_API_KEY;
  if (!key) {
    const err = new Error('Missing GHL_API_KEY');
    err.status = 500;
    throw err;
  }
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Fetch a page of contacts from GHL.
 * @param {object} opts
 * @param {number} opts.limit - max 100
 * @param {number} [opts.startAfter] - timestamp for pagination
 * @param {string} [opts.startAfterId] - contact id for pagination
 */
async function getContacts({ limit = 100, startAfter, startAfterId } = {}) {
  return handleGhlApiCall(async () => {
    const params = { limit };
    if (startAfter) params.startAfter = startAfter;
    if (startAfterId) params.startAfterId = startAfterId;

    const res = await axios.get(`${GHL_API_BASE}/contacts/`, {
      headers: getHeaders(),
      params
    });
    return res.data;
  });
}

/**
 * Fetch ALL contacts from GHL, paginating through all pages.
 */
async function getAllContacts() {
  const allContacts = [];
  let startAfter = null;
  let startAfterId = null;

  while (true) {
    const opts = { limit: 100 };
    if (startAfter) opts.startAfter = startAfter;
    if (startAfterId) opts.startAfterId = startAfterId;

    const data = await getContacts(opts);
    const contacts = data.contacts || [];
    allContacts.push(...contacts);

    if (contacts.length < 100 || !data.meta || !data.meta.nextPageUrl) {
      break;
    }

    startAfter = data.meta.startAfter;
    startAfterId = data.meta.startAfterId;
  }

  return allContacts;
}

/**
 * Fetch a single contact by GHL contact ID.
 */
async function getContact(contactId) {
  return handleGhlApiCall(async () => {
    const res = await axios.get(`${GHL_API_BASE}/contacts/${contactId}`, {
      headers: getHeaders()
    });
    return res.data.contact;
  });
}

/**
 * Create a new contact in GHL.
 */
async function createContact({ email, firstName, lastName, phone, businessName, tags = [] }) {
  return handleGhlApiCall(async () => {
    const body = {};
    if (email) body.email = email;
    if (firstName) body.firstName = firstName;
    if (lastName) body.lastName = lastName;
    if (phone) body.phone = phone;
    if (businessName) body.companyName = businessName;
    if (tags.length) body.tags = tags;

    const res = await axios.post(`${GHL_API_BASE}/contacts/`, body, {
      headers: getHeaders()
    });
    return res.data.contact;
  });
}

/**
 * Update an existing contact in GHL.
 */
async function updateContact(contactId, updates) {
  return handleGhlApiCall(async () => {
    const body = {};
    if (updates.email) body.email = updates.email;
    if (updates.firstName) body.firstName = updates.firstName;
    if (updates.lastName) body.lastName = updates.lastName;
    if (updates.phone) body.phone = updates.phone;
    if (updates.businessName) body.companyName = updates.businessName;

    const res = await axios.put(`${GHL_API_BASE}/contacts/${contactId}`, body, {
      headers: getHeaders()
    });
    return res.data.contact;
  });
}

/**
 * Add tags to a GHL contact.
 */
async function addTags(contactId, tags) {
  return handleGhlApiCall(async () => {
    const res = await axios.post(
      `${GHL_API_BASE}/contacts/${contactId}/tags`,
      { tags },
      { headers: getHeaders() }
    );
    return res.data;
  });
}

/**
 * Remove tags from a GHL contact.
 */
async function removeTags(contactId, tags) {
  return handleGhlApiCall(async () => {
    const res = await axios.delete(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
      headers: getHeaders(),
      data: { tags }
    });
    return res.data;
  });
}

/**
 * Enhanced error handling wrapper for GHL API calls
 */
async function handleGhlApiCall(apiCall) {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    if (error.response) {
      // Handle different HTTP status codes
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${data?.message || 'Invalid request parameters'}`);
        case 401:
          throw new Error(`Unauthorized: Invalid API key or authentication failed`);
        case 403:
          throw new Error(`Forbidden: Insufficient permissions for this operation`);
        case 404:
          throw new Error(`Not Found: ${data?.message || 'Resource not found'}`);
        case 429:
          throw new Error(`Rate Limit Exceeded: Too many requests, please try again later`);
        case 500:
          throw new Error(`Server Error: GHL API internal error`);
        case 502:
        case 503:
        case 504:
          throw new Error(`Service Unavailable: GHL API is temporarily unavailable`);
        default:
          throw new Error(`API Error (${status}): ${data?.message || error.message}`);
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network Error: Unable to connect to GHL API');
    } else {
      // Other errors
      throw new Error(`Error: ${error.message}`);
    }
  }
}

/**
 * Look up a contact by email. Returns null if not found.
 */
async function findContactByEmail(email) {
  return handleGhlApiCall(async () => {
    const res = await axios.get(`${GHL_API_BASE}/contacts/lookup`, {
      headers: getHeaders(),
      params: { email }
    });
    return res.data.contact || null;
  }).catch(error => {
    // If it's a 404 error, return null as expected
    if (error.message.includes('Not Found')) {
      return null;
    }
    // Re-throw other errors
    throw error;
  });
}

/**
 * Upsert a contact: find by email, update if found, create if not.
 * Returns { contact, created: boolean }
 */
async function upsertContact({ email, firstName, lastName, phone, businessName, tags = [] }) {
  const existing = email ? await findContactByEmail(email) : null;

  if (existing) {
    const updated = await updateContact(existing.id, { firstName, lastName, phone, businessName });
    if (tags.length) {
      await addTags(existing.id, tags);
    }
    return { contact: updated || existing, created: false };
  }

  const contact = await createContact({ email, firstName, lastName, phone, businessName, tags });
  return { contact, created: true };
}

module.exports = {
  getContacts,
  getAllContacts,
  getContact,
  createContact,
  updateContact,
  addTags,
  removeTags,
  findContactByEmail,
  upsertContact
};
