// Validators: simple validation helpers
export const GROUP_NAME_MAX_LENGTH = 28;
export const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
};
export const isValidId = (id) => {
    return /^[a-z0-9\-]{1,50}$/.test(id);
};
