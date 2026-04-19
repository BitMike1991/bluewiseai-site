import useDraft from './useDraft';

/**
 * Toiture-specific draft persistence.
 * Wraps useDraft for toiture_drafts table (customer_id=9).
 */
export default function useToitureDraft({ getState }) {
  return useDraft({
    table: 'toiture_drafts',
    customerId: 9,
    localStorageKey: 'pur_toiture_draft',
    emptyCheck: (payload) => {
      return !payload.client?.name && !payload.client?.phone;
    },
    getPayload: () => getState(),
    getMetaFields: (payload) => ({
      client_name: payload.client?.name || null,
    }),
  });
}
