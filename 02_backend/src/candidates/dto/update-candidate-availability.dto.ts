import { IsIn } from "class-validator";
import { CANDIDATE_AVAILABILITY } from "../candidate.constants";

export class UpdateCandidateAvailabilityDto {
  @IsIn([CANDIDATE_AVAILABILITY.ACTIVE_SEEKING, CANDIDATE_AVAILABILITY.NOT_ACTIVE])
  status!: string;
}
