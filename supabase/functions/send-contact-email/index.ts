import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTransport } from 'npm:nodemailer@6.9.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ContactFormData {
  name: string
  email: string
  company?: string
  subject: string
  message: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const formData: ContactFormData = await req.json()

    // Validate required fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create SMTP transporter
    const transporter = createTransport({
      host: 'mail.spacemail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'admin@parscade.com',
        pass: 'Plcentaonweetbix1!',
      },
    })

    // Email content
    const mailOptions = {
      from: 'admin@parscade.com',
      to: 'admin@parscade.com',
      replyTo: formData.email,
      subject: `Contact Form: ${formData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 0;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #374151;">Contact Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 100px;">Name:</td>
                <td style="padding: 8px 0; color: #1f2937;">${formData.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937;">${formData.email || 'Not provided'}</td>
              </tr>
              ${formData.company ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Company:</td>
                <td style="padding: 8px 0; color: #1f2937;">${formData.company}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td>
                <td style="padding: 8px 0; color: #1f2937;">${formData.subject || 'Not provided'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Message</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
              <p style="white-space: pre-wrap; line-height: 1.6; margin: 0; color: #1f2937; font-size: 14px;">${formData.message || 'No message provided'}</p>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px; font-size: 12px; color: #1e40af;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; padding: 2px 0; color: #000000;">Sent from:</td>
                <td style="padding: 2px 0; color: #000000;">Parscade Contact Form</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 2px 0; color: #000000;">Timestamp:</td>
                <td style="padding: 2px 0; color: #000000;">${new Date().toLocaleString('en-US', { 
                  timeZone: 'America/Los_Angeles',
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 2px 0; color: #000000;">IP Address:</td>
                <td style="padding: 2px 0; color: #000000;">${req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown'}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${formData.name || 'Not provided'}
Email: ${formData.email || 'Not provided'}
${formData.company ? `Company: ${formData.company}\n` : ''}Subject: ${formData.subject || 'Not provided'}

Message:
${formData.message || 'No message provided'}

---
Sent from: Parscade Contact Form
Timestamp: ${new Date().toLocaleString('en-US', { 
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})}
IP Address: ${req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown'}
      `,
    }

    // Send immediate response to user
    const response = new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message received! We\'ll get back to you within 24 hours.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

    // Send email in background (don't await)
    transporter.sendMail(mailOptions).catch((emailError) => {
      console.error('Background email sending failed:', emailError)
      // Could implement retry logic or dead letter queue here
    })

    return response

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})