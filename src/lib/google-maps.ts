declare global {
  interface Window {
    google?: typeof google;
    __navqironGoogleMaps?: Promise<typeof google>;
  }
}

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps faqat brauzerda yuklanadi"));
  }
  if (window.google?.maps?.marker) {
    return Promise.resolve(window.google);
  }
  if (window.__navqironGoogleMaps) {
    return window.__navqironGoogleMaps;
  }

  const promise = new Promise<typeof google>((resolve, reject) => {
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      libraries: "marker",
      language: "uz",
      region: "UZ",
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps yuklanmadi"));
    };
    script.onerror = () => {
      window.__navqironGoogleMaps = undefined;
      reject(new Error("Google Maps skriptini yuklab bo'lmadi"));
    };
    document.head.appendChild(script);
  });

  window.__navqironGoogleMaps = promise;
  promise.catch(() => {
    window.__navqironGoogleMaps = undefined;
  });
  return promise;
}
