import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: number;
            username: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        user: {
            id: number;
            username: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        token: string;
    }>;
    getProfile(req: any): Promise<{
        id: any;
        username: any;
        email: any;
        firstName: any;
        lastName: any;
        preferredLanguage: any;
    }>;
}
