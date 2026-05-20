interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const sendEmail = async (options: EmailOptions) => {
  try {
    const BREVP_API_KEY = process.env.BREVP_API_KEY?.trim();
    if (!BREVP_API_KEY) {
      console.error('BREVP_API_KEY is not defined in environment variables');
      throw new Error('BREVP_API_KEY is not defined');
    }

    const data = {
      sender: {
        name: 'Real Estate Platform',
        email: process.env.EMAIL_USER,
      },
      to: [{ email: options.email }],
      subject: options.subject,
      htmlContent: options.message,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVP_API_KEY,
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Email sent successfully via Brevo:', result);
    } else {
      console.error('Error sending email:', result);
      throw new Error(result.message || 'Error sending email via Brevo');
    }
  } catch (error) {
    console.error('BrevoError sending email:', error);
    throw error;
  }
};

export default sendEmail;
