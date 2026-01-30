// Services layer: business logic built on top of domain types
import { DomainExample, createDomainExample } from "../domain";

export const makeExample = (id: string, name: string): DomainExample => {
  // Placeholder for real business logic
  return createDomainExample(id, name);
};

export const greetService = (name: string) => {
  return `Service says hello to ${name}`;
};
