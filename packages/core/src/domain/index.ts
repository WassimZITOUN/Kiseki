// Domain layer: core domain types and helpers
export type DomainExample = {
  id: string;
  name: string;
};

export const createDomainExample = (id: string, name: string): DomainExample => ({
  id,
  name,
});
