import { useEffect, useState } from "react";

export function useRequireLocation() {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setAllowed(true);
      return;
    }

    const updatePermissionStatus = (state) => {
      if (state === "denied") {
        setAllowed(false);
      } else {
        setAllowed(true);
      }
    };

    const checkPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        updatePermissionStatus(permission.state);
        permission.onchange = () => updatePermissionStatus(permission.state);
      } catch (e) {
        setAllowed(true);
      }
    };

    checkPermission();
  }, []);

  return allowed;
}
