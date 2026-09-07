const AUTH_ERROR_MESSAGES = {
  access_denied:
    "Google sign-in was cancelled.",
  invalid_request:
    "Google sign-in request was invalid.",
  unauthorized_client:
    "Google has not authorized Clutch.",
  server_error:
    "Google sign-in failed on the server."
};

export function getAuthError() {
  const params = new URLSearchParams(
    window.location.search
  );

  const error = params.get("auth_error");

  if (!error) {
    return null;
  }

  return (
    AUTH_ERROR_MESSAGES[error] ||
    `Google sign-in failed: ${error}`
  );
}

export function clearAuthError() {
  const url = new URL(
    window.location.href
  );

  url.searchParams.delete("auth_error");

  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`
  );
}

export function redirectToLogin() {
  window.location.assign(
    "/api/auth/google"
  );
}

export function logout() {
  window.location.assign(
    "/api/auth/logout"
  );
}
