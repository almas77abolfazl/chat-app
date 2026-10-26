function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`;
  }
  return 'http://localhost:3000';
}

export const environment = {
  production: false,
  get apiUrl(): string {
    return `${getBaseUrl()}/v1`;
  },
  get socketUrl(): string {
    return getBaseUrl();
  },
  get uploadUrl(): string {
    return `${getBaseUrl()}/uploads`;
  },
};
