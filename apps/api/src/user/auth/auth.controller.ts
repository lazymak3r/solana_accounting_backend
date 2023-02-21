import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { SignInDto } from './dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('/signup')
  // @ApiOperation({ summary: 'Sign up' })
  // signUp(@Body() signUpDto: SignUpDto) {
  //   return this.authService.signUp(signUpDto)
  // }

  @Post('/signin')
  @ApiOperation({ summary: 'Sign in' })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto)
  }
}
