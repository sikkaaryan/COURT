import { useEffect, useState } from "react";

export default function usePwa() {
  const [isInstalled, setIsInstalled] =
    useState(false);

  const [isStandalone, setIsStandalone] =
    useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia?.(
          "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true;

      setIsStandalone(Boolean(standalone));
      setIsInstalled(Boolean(standalone));
    };

    checkStandalone();

    const mediaQuery =
      window.matchMedia?.(
        "(display-mode: standalone)"
      );

    mediaQuery?.addEventListener(
      "change",
      checkStandalone
    );

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
    };

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      mediaQuery?.removeEventListener(
        "change",
        checkStandalone
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  return {
    isInstalled,
    isStandalone
  };
}
