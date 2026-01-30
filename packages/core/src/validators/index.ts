// Validators: simple validation helpers

export const isNonEmptyString = (value: string): boolean => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isValidId = (id: string): boolean => {
  return /^[a-z0-9\-]{1,50}$/.test(id);
};
