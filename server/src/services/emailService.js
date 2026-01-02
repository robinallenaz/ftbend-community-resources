const { sendEmail } = require('../lib/email');

class EmailService {
  constructor() {
    this.fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'robin@transvoices.us';
    this.fromName = process.env.SMTP_FROM_NAME || 'Fort Bend LGBTQIA+ Community';
  }

  async sendNewsletterWelcome(toEmail, toName) {
    try {
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D1DA9C;">🌈 Welcome to Our Community!</h2>
            <p>Thank you for joining the Fort Bend County LGBTQIA+ Community newsletter!</p>
            <p>You'll receive updates about:</p>
            <ul>
              <li>🏥 Local healthcare resources</li>
              <li>⚖️ Legal support services</li>
              <li>📅 Community events and meetups</li>
              <li>🤝 Support groups and organizations</li>
            </ul>
            <p>Together we build a stronger, more inclusive community.</p>
            <p><em>There is no community without unity 🏳️‍⚧️🏳️‍🌈</em></p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              Fort Bend County LGBTQIA+ Community Resources<br>
              <a href="https://ftbend-lgbtqia-community.org">ftbend-lgbtqia-community.org</a>
            </p>
          </div>
        `;

      const result = await sendEmail({
        to: toEmail,
        subject: 'Welcome to Fort Bend LGBTQIA+ Community Newsletter!',
        html,
        text: `Welcome to Fort Bend LGBTQIA+ Community Newsletter, ${toName || ''}!`
      });
      
      console.log("Newsletter welcome email sent successfully");
      return result;
    } catch (error) {
      console.error("Error sending newsletter welcome email:", error);
      throw error;
    }
  }

  async sendNewsletterCampaign(toEmails, subject, htmlContent) {
    try {
      const result = await sendEmail({
        to: toEmails,
        subject,
        html: htmlContent,
        text: ''
      });
      
      console.log(`Newsletter campaign sent to ${toEmails.length} recipients`);
      return result;
    } catch (error) {
      console.error("Error sending newsletter campaign:", error);
      throw error;
    }
  }

  async sendContactNotification(contactData) {
    try {
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D1DA9C;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Message:</strong></p>
            <p>${contactData.message}</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              Sent from Fort Bend LGBTQIA+ Community Website
            </p>
          </div>
        `;

      const to = process.env.CONTACT_NOTIFY_EMAIL || 'robin.allen.az@gmail.com';
      const result = await sendEmail({
        to,
        subject: 'New Contact Form Submission',
        html,
        text: `New contact form submission from ${contactData.name} (${contactData.email}).`
      });
      
      console.log("Contact notification sent successfully");
      return result;
    } catch (error) {
      console.error("Error sending contact notification:", error);
      throw error;
    }
  }
}

module.exports = new EmailService();
