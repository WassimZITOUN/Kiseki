"use client";

import React, { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppRegistry = require("react-native-web/dist/exports/AppRegistry").default;

export function Registry({ children }: { children: React.ReactNode }) {
  const isInserted = useRef(false);

  useServerInsertedHTML(() => {
    if (isInserted.current) return null;
    isInserted.current = true;

    AppRegistry.registerComponent("Main", () => () => null);
    const { getStyleElement } = AppRegistry.getApplication("Main");

    return <>{getStyleElement()}</>;
  });

  return <>{children}</>;
}
