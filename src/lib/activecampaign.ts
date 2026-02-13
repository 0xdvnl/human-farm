/**
 * ActiveCampaign Integration for Human Farm
 *
 * Handles syncing users to ActiveCampaign for marketing automation:
 * - Adding users to the "Human Farm - Grow" list on registration
 * - Managing tags based on referral activity
 *
 * NOTE: Email verification is handled by Supabase Auth, not ActiveCampaign
 */

const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL; // e.g., https://youraccountname.api-us1.com
const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;
const AC_LIST_ID = process.env.ACTIVECAMPAIGN_LIST_ID || '1'; // Human Farm - Grow list ID

// Tag names for marketing automation
const TAGS = {
  NO_REFERRALS: 'hf-no-referrals',
  HAS_REFERRALS: 'hf-has-referrals',
  NODE_1: 'hf-node-1',
  NODE_2: 'hf-node-2',
  NODE_3: 'hf-node-3',
  NODE_4: 'hf-node-4',
  ACTIVE_POSTER: 'hf-active-poster',
};

interface ACResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Check if ActiveCampaign is configured
 */
export function isACConfigured(): boolean {
  const configured = !!(AC_API_URL && AC_API_KEY);
  if (!configured) {
    console.log('[ActiveCampaign] Not configured - missing API_URL or API_KEY');
  }
  return configured;
}

/**
 * Make an API request to ActiveCampaign
 */
async function acRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<ACResponse> {
  if (!isACConfigured()) {
    return { success: false, error: 'ActiveCampaign not configured' };
  }

  try {
    // Remove trailing slash from API URL if present
    const baseUrl = AC_API_URL!.replace(/\/$/, '');
    const url = `${baseUrl}/api/3/${endpoint}`;

    console.log(`[ActiveCampaign] ${method} ${endpoint}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Api-Token': AC_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[ActiveCampaign] API error:', response.status, JSON.stringify(data));
      return { success: false, error: data.message || `API error ${response.status}`, data };
    }

    console.log(`[ActiveCampaign] Success: ${endpoint}`);
    return { success: true, data };
  } catch (error) {
    console.error('[ActiveCampaign] Request failed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Find a contact by email
 */
async function findContactByEmail(email: string): Promise<string | null> {
  const result = await acRequest(`contacts?email=${encodeURIComponent(email)}`);
  if (result.success && result.data?.contacts?.length > 0) {
    return result.data.contacts[0].id;
  }
  return null;
}

/**
 * Get or create a tag by name
 */
async function getOrCreateTag(tagName: string): Promise<string | null> {
  // Search for existing tag
  const searchResult = await acRequest(`tags?search=${encodeURIComponent(tagName)}`);

  if (searchResult.success && searchResult.data?.tags?.length > 0) {
    // Find exact match
    const exactMatch = searchResult.data.tags.find(
      (t: any) => t.tag.toLowerCase() === tagName.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch.id;
    }
  }

  // Create new tag
  const createResult = await acRequest('tags', 'POST', {
    tag: {
      tag: tagName,
      tagType: 'contact',
      description: `Human Farm: ${tagName}`,
    },
  });

  return createResult.data?.tag?.id || null;
}

/**
 * Add a tag to a contact
 */
async function addTagToContact(contactId: string, tagName: string): Promise<ACResponse> {
  const tagId = await getOrCreateTag(tagName);

  if (!tagId) {
    return { success: false, error: `Could not find or create tag: ${tagName}` };
  }

  return acRequest('contactTags', 'POST', {
    contactTag: {
      contact: contactId,
      tag: tagId,
    },
  });
}

/**
 * Remove a tag from a contact
 */
async function removeTagFromContact(contactId: string, tagName: string): Promise<ACResponse> {
  // Find the tag ID
  const tagId = await getOrCreateTag(tagName);
  if (!tagId) {
    return { success: true }; // Tag doesn't exist, nothing to remove
  }

  // Find the contactTag association
  const contactTagsResult = await acRequest(`contacts/${contactId}/contactTags`);
  if (!contactTagsResult.success) {
    return contactTagsResult;
  }

  const contactTag = contactTagsResult.data?.contactTags?.find(
    (ct: any) => ct.tag === tagId
  );

  if (!contactTag) {
    return { success: true }; // Tag not on contact
  }

  return acRequest(`contactTags/${contactTag.id}`, 'DELETE');
}

/**
 * Create or update a contact in ActiveCampaign and subscribe to list
 * Used for marketing automation - called after Supabase Auth signup
 */
export async function syncContactToAC(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  userId: string;
  referralCode: string;
}): Promise<ACResponse> {
  const { email, firstName, lastName } = params;

  // Log immediately - this should always appear if the function is called
  console.log(`[ActiveCampaign] ====== SYNC CONTACT CALLED ======`);
  console.log(`[ActiveCampaign] Email: ${email}, User: ${params.userId}`);
  console.log(`[ActiveCampaign] API URL configured: ${!!AC_API_URL}`);
  console.log(`[ActiveCampaign] API KEY configured: ${!!AC_API_KEY}`);
  console.log(`[ActiveCampaign] List ID: ${AC_LIST_ID}`);

  // Step 1: Create or update contact
  const contactPayload = {
    contact: {
      email,
      firstName: firstName || '',
      lastName: lastName || '',
    },
  };

  // Check if contact exists
  let contactId = await findContactByEmail(email);
  let contactResult: ACResponse;

  if (contactId) {
    console.log(`[ActiveCampaign] Updating existing contact: ${contactId}`);
    contactResult = await acRequest(`contacts/${contactId}`, 'PUT', contactPayload);
  } else {
    console.log(`[ActiveCampaign] Creating new contact`);
    contactResult = await acRequest('contacts', 'POST', contactPayload);
    contactId = contactResult.data?.contact?.id;
  }

  if (!contactResult.success || !contactId) {
    console.error('[ActiveCampaign] Failed to create/update contact:', contactResult.error);
    return contactResult;
  }

  console.log(`[ActiveCampaign] Contact ID: ${contactId}`);

  // Step 2: Subscribe to list
  console.log(`[ActiveCampaign] Subscribing to list ${AC_LIST_ID}`);
  const listResult = await acRequest('contactLists', 'POST', {
    contactList: {
      list: AC_LIST_ID,
      contact: contactId,
      status: 1, // 1 = subscribed
    },
  });

  if (!listResult.success) {
    console.error('[ActiveCampaign] Failed to subscribe to list:', listResult.error);
    // Don't return error - contact was created, list subscription might fail if already subscribed
  }

  // Step 3: Add initial tag
  console.log(`[ActiveCampaign] Adding tag: ${TAGS.NO_REFERRALS}`);
  await addTagToContact(contactId, TAGS.NO_REFERRALS);

  console.log(`[ActiveCampaign] Contact synced successfully: ${email}`);
  return { success: true, data: { contactId } };
}

/**
 * Update a contact's referral status and tags
 */
export async function updateReferralCount(
  email: string,
  referralCount: number
): Promise<ACResponse> {
  console.log(`[ActiveCampaign] Updating referral count for ${email}: ${referralCount}`);

  const contactId = await findContactByEmail(email);
  if (!contactId) {
    console.log(`[ActiveCampaign] Contact not found: ${email}`);
    return { success: false, error: 'Contact not found' };
  }

  // Update tags based on referral count
  if (referralCount > 0) {
    await removeTagFromContact(contactId, TAGS.NO_REFERRALS);
    await addTagToContact(contactId, TAGS.HAS_REFERRALS);
  }

  // Add node tags based on milestones
  if (referralCount >= 5) {
    await addTagToContact(contactId, TAGS.NODE_1);
  }
  if (referralCount >= 10) {
    await addTagToContact(contactId, TAGS.NODE_2);
  }
  if (referralCount >= 15) {
    await addTagToContact(contactId, TAGS.NODE_3);
  }
  if (referralCount >= 20) {
    await addTagToContact(contactId, TAGS.NODE_4);
  }

  console.log(`[ActiveCampaign] Updated referral tags for ${email}`);
  return { success: true };
}

/**
 * Mark a contact as an active poster
 */
export async function markAsActivePoster(email: string): Promise<ACResponse> {
  console.log(`[ActiveCampaign] Marking as active poster: ${email}`);

  const contactId = await findContactByEmail(email);
  if (!contactId) {
    return { success: false, error: 'Contact not found' };
  }

  return addTagToContact(contactId, TAGS.ACTIVE_POSTER);
}
