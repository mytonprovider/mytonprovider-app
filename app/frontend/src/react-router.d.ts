import type { NavigateOptions, To } from "react-router";

// Declarative routing never returns the promise v7 added to navigate() for the data router.
declare module "react-router" {
  interface NavigateFunction {
    (to: To, options?: NavigateOptions): void;
    (delta: number): void;
  }
}
