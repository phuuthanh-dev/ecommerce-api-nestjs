import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from '../config'
import { OTPEmail } from 'emails/otp'
import * as React from 'react'
// import fs from 'fs'
// import path from 'path'

@Injectable()
export class EmailService {
  private resend: Resend

  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendOTP(payload: { email: string; code: string }) {
    // const otpTemplate = fs.readFileSync(path.resolve('src/shared/email-templates/otp.html'), 'utf8')
    const subject = 'Mã OTP'
    return this.resend.emails.send({
      from: 'Nest.js Ecommerce <no-reply@phuuthanh.id.vn>',
      to: payload.email,
      subject,
      react: <OTPEmail otpCode={payload.code} title={subject} />,
      // html: otpTemplate.replaceAll('{{code}}', payload.code).replaceAll('{{subject}}', subject),
    })
  }
}
