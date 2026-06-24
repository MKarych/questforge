import { UserRequest } from '../../common/types/user-request.type';
import { UsersService } from '../users/users.service';
export declare class UploadController {
    private readonly usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    uploadAvatar(file: Express.Multer.File, req: UserRequest): Promise<{
        avatarUrl: string;
    }>;
}
//# sourceMappingURL=upload.controller.d.ts.map