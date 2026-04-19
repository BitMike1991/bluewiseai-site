import useDraft from './useDraft';

/**
 * Commande-specific draft persistence.
 * Wraps useDraft for commande_drafts table (customer_id=9).
 */
export default function useCommandeDraft({ getState }) {
  return useDraft({
    table: 'commande_drafts',
    customerId: 9,
    localStorageKey: 'pur_commande_draft',
    emptyCheck: (payload) => {
      return (!payload.items || payload.items.length === 0) &&
        !payload.project?.client &&
        !payload.project?.ref;
    },
    getPayload: () => {
      const s = getState();
      return {
        supplier: s.supplier,
        item_supplier: s.item_supplier,
        project: s.project,
        items: s.items,
      };
    },
    getMetaFields: (payload) => ({
      project_ref: payload.project?.ref || null,
      client_name: payload.project?.client || null,
      supplier: payload.supplier,
    }),
  });
}
