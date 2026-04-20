/**
 * Serialize a commande-tool item (reducer shape) into a devis line_item.
 *
 * Single source of truth — was previously duplicated inside
 * `pages/api/commande/save-as-job.js` as `buildLineItems`. Extracted here
 * so the DevisEditor ItemBuilderModal (client-side, no API roundtrip)
 * can produce identical line_items for new items added from the devis
 * editor.
 *
 * Input `it` shape: the object built inside CommandePage when the user
 * hits "Add" — carries category, window_type / entry_door_style /
 * patio_collection, config (with panels + max + widthRatios), the
 * full `form` snapshot (thermos/color/grille/door_model/...), width,
 * height, qty, note, supplier.
 *
 * Output: line_item object compatible with devis storage and
 * richItemSvg() / PUR template / contract template.
 */

const THERMOS_LABELS = {
  double: 'Thermos 7/8" double Low-E Argon',
  triple: 'Thermos 1 1/4" triple Low-E Argon',
  lamine: 'Thermos laminé',
  givre:  'Thermos givré',
  gluechip: 'Thermos gluechip',
};

function buildSpecsString(it) {
  const parts = [];
  if (it.collection || it.collection_info?.name) {
    parts.push(`Collection ${it.collection_info?.name || it.collection}`);
  }
  if (it.color_name || it.color) {
    parts.push(`Couleur ${it.color_name || it.color}`);
  }
  if (it.thermos) parts.push(THERMOS_LABELS[it.thermos] || it.thermos);
  if (it.glass_type) {
    parts.push(`Verre ${it.glass_type === 'triple' ? 'Triple Low-E' : 'Double Low-E Argon'}`);
  }
  if (it.frame) parts.push(`Cadre ${it.frame}`);
  if (it.color_ext && it.color_int) {
    parts.push(`Couleurs ext. ${it.color_ext} / int. ${it.color_int}`);
  }
  if (it.door_model) parts.push(`Modèle ${it.door_model}`);
  if (it.moustiquaire) parts.push('Moustiquaire incluse');
  if (it.note) parts.push(`Note: ${it.note}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * @param {Object} it — commande-tool item (see shape above)
 * @param {string} [globalSupplier] — fallback when it.supplier is unset
 * @returns {Object} line_item ready to push into quotes.line_items
 */
export function serializeCommandeItem(it, globalSupplier) {
  const itemSupplier = it?.supplier || globalSupplier || 'royalty';
  const specs = it?.specs || buildSpecsString(it) || null;

  let dimensions = it?.dimensions || null;
  if (!dimensions && (it?.width || it?.height)) {
    dimensions = {
      width:  it.width  ? String(it.width)  : null,
      height: it.height ? String(it.height) : null,
    };
  }

  const description = [
    it?.window_type || it?.entry_door_style || it?.patio_collection || it?.category,
    it?.config_code || it?.model || '',
    it?.ouvrant || '',
  ].filter(Boolean).join(' ').trim() || 'Article';

  return {
    description,
    qty:        it?.qty || 1,
    unit_price: null,
    total:      null,

    // Client-facing identity
    type:    it?.window_type || it?.entry_door_style || it?.patio_collection || it?.category || null,
    model:   it?.config_code || it?.model || null,
    ouvrant: it?.ouvrant || null,
    dimensions,
    specs,
    category: it?.category || null,
    collection: it?.collection_info?.name || it?.collection || null,

    // Color flat fields DevisEditor already renders in specs prepend
    material:  it?.collection === 'hybride' ? 'hybride' : (it?.collection === 'pvc' ? 'upvc' : undefined),
    color_ext: it?.color_ext || it?.color_name || null,
    color_int: it?.color_int || it?.color_name || null,

    // Tracking
    _source:    'item_builder',
    _supplier:  itemSupplier,

    // SVG rendering metadata — identical to what save-as-job writes.
    // Without these the rich renderers fall back to generic rectangles.
    _category:          it?.category          || null,
    _window_type:       it?.window_type       || null,
    _entry_door_style:  it?.entry_door_style  || null,
    _patio_collection:  it?.patio_collection  || null,
    _config:            it?.config            || null,

    // Full form snapshot so the ItemBuilderModal can rehydrate for
    // edit-mode without data loss (thermos, grille, door_model, ...).
    // save-as-job line_items don't carry this today — devis-created
    // items will, which is fine (extra keys in JSONB are harmless).
    _form: {
      collection:      it?.collection      || null,
      color:           it?.color           || null,
      color_name:      it?.color_name      || null,
      color_ext:       it?.color_ext       || null,
      color_int:       it?.color_int       || null,
      thermos:         it?.thermos         || null,
      moustiquaire:    it?.moustiquaire    ?? null,
      egress:          it?.egress          || null,
      grille:          it?.grille          || null,
      frame_thickness: it?.frame_thickness || null,
      frame_depth:     it?.frame_depth     || null,
      frame:           it?.frame           || null,
      door_model:      it?.door_model      || null,
      swing:           it?.swing           || null,
      moulding:        it?.moulding        || null,
      handle:          it?.handle          || null,
      sill:            it?.sill            || null,
      lock:            it?.lock            || null,
      glass:           it?.glass           || null,
      glass_type:      it?.glass_type      || null,
      blinds:          it?.blinds          || null,
      hinges:          it?.hinges          || null,
      slab_w:          it?.slab_w          || null,
    },
  };
}
