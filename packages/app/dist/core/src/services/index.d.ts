import { DomainExample } from "../domain";
export declare const makeExample: (id: string, name: string) => DomainExample;
export declare const greetService: (name: string) => string;
export { createGroupsService } from "./groups";
export { createVotesService } from "./votes";
export { createSubmissionsService } from "./submissions";
