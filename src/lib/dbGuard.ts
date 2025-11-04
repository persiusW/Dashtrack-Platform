export function warnUsersTable(table: string, op: string) {
  if (
    process.env.NODE_ENV !== "production" &&
    table === "users" &&
    (op === "insert" || op === "update" || op === "upsert" || op === "delete")
  ) {
    console.warn("[dbGuard] Mutation attempted on 'users' table. Use 'profiles' instead.");
  }
}
