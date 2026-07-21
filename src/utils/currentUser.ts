export function currentUserName(): string {
  return localStorage.getItem("userDisplayName") || localStorage.getItem("userEmail") || "Користувач";
}

export function clearCurrentUser(): void {
  localStorage.removeItem("userRole");
  localStorage.removeItem("userDisplayName");
  localStorage.removeItem("userEmail");
}
