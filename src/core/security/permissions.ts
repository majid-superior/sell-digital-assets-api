export type UserRole = "admin" | "creator" | "user";

export const ROLES: Record<string, UserRole> = {
  ADMIN: "admin",
  CREATOR: "creator",
  USER: "user",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["*"],
  creator: ["products:create", "products:update", "products:delete", "inventory:manage"],
  user: ["products:view", "products:purchase", "assets:download"],
};

export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as UserRole] || [];
  if (permissions.includes("*")) return true;
  return permissions.includes(requiredPermission);
}
