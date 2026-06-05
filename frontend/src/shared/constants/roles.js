// ============================================================================
//  roles — canonical role enum used across auth & routing
// ============================================================================

export const ROLES = Object.freeze({
  OWNER: 'owner',
  STAFF: 'staff',
  ADMIN: 'admin',
});

export const ROLE_LABEL = Object.freeze({
  [ROLES.OWNER]: 'Business Owner',
  [ROLES.STAFF]: 'Staff',
  [ROLES.ADMIN]: 'Platform Admin',
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));
