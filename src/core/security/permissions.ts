export type UserRole = "admin" | "seller" | "customer" | "creator" | "user";

export const ROLES = {
  ADMIN: "admin",
  SELLER: "seller",
  CUSTOMER: "customer",
  // Legacy aliases
  CREATOR: "seller",
  USER: "customer",
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  seller: ["products:create", "products:update", "products:delete", "inventory:manage", "analytics:view"],
  creator: ["products:create", "products:update", "products:delete", "inventory:manage", "analytics:view"],
  customer: ["products:view", "products:purchase", "assets:download"],
  user: ["products:view", "products:purchase", "assets:download"],
};

export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  if (permissions.includes("*")) return true;
  return permissions.includes(requiredPermission);
}

