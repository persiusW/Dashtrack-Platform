export function assertServerOnlyEnv(name: string, value: string | undefined) {
  if (typeof window !== "undefined" && value) {
    console.warn(`[envGuard] ${name} is accessible on the client — remove any client-side usage immediately.`);
  }
}
