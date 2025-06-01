import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from '../config'
import { OTPEmail } from 'emails/otp'
import * as React from 'react'
// import { render } from '@react-email/render'
// import { pretty } from '@react-email/components'

@Injectable()
export class EmailService {
  private resend: Resend

  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  async sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP'
    // const html = await pretty(await render(<OTPEmail otpCode={payload.code} title={subject} />))
    return this.resend.emails.send({
      from: 'Nest.js Ecommerce <no-reply@phuuthanh.id.vn>',
      to: payload.email,
      subject,
      react: <OTPEmail otpCode={payload.code} title={subject} />,
      // html,
    })
  }
}
