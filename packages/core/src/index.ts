import { GreetFn } from "@my-app/types";

export const greet: GreetFn = (name) => {
  return `Hello from core, ${name}!`;
};

export * as domain from "./domain";
export * as services from "./services";
export * as validators from "./validators";
