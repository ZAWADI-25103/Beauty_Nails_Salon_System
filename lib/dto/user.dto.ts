import { User, ClientProfile, WorkerProfile } from "prisma/generated/client";
import { toClientProfileDTO } from "./clientProfile.dto";
import { toWorkerProfileDTO } from "./workerProfile.dto";

type UserWithProfiles = User & {
  clientProfile?: ClientProfile | null;
  workerProfile?: WorkerProfile | null;
};

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  emailVerified: Date | null;
  isActive: boolean;

  clientProfile: ReturnType<typeof toClientProfileDTO>;
  workerProfile: ReturnType<typeof toWorkerProfileDTO>;
};

export function toUserDTO(user: UserWithProfiles): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    isActive: user.isActive,

    clientProfile: toClientProfileDTO(user.clientProfile),
    workerProfile: toWorkerProfileDTO(user.workerProfile),
  };
}
