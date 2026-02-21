// Services layer: business logic built on top of domain types
import { createDomainExample } from "../domain";
export const makeExample = (id, name) => {
    // Placeholder for real business logic
    return createDomainExample(id, name);
};
export const greetService = (name) => {
    return `Service says hello to ${name}`;
};
export { createGroupsService } from "./groups";
export { createVotesService } from "./votes";
export { createSubmissionsService } from "./submissions";
