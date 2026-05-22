import Contact, { IContact } from '../models/contact.model.js';
import { Request, Response } from 'express';
import sendEmail from '../utils/sendEmail.js';

interface ContactBody {
  name: string;
  email: string;
  phone?: string;
  role: IContact['role'];
  message: string;
}

export const submitContactForm = async (req: Request<{}, {}, ContactBody>, res: Response) => {
  try {
    const { name, email, phone, role, message } = req.body;
    const contact = new Contact({ name, email, phone, role, message });

    // Send email notification
    await contact.save();

    // Notify Admin via Brevo
    const adminEmail = process.env.EMAIL_USER;
    if (!adminEmail) {
      console.error('EMAIL_USER env variable is not set');
      return res.status(500).json({ error: 'Server configuration error', success: false });
    }
    const adminMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <h2 style="color: #0d9488;">New Contact Request</h2>
            <p>You have received a new message from the platform.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                <p><strong>Role:</strong> ${role}</p>
                <p style="margin-top: 15px;"><strong>Message:</strong></p>
                <p style="font-style: italic; color: #475569;">"${message}"</p>
            </div>
            </div>
        </div>
    `;

    try {
      await sendEmail({
        email: adminEmail,
        subject: `New contact request from ${name}`,
        message: adminMessage,
      });
    } catch (emailError) {
      console.error('Error sending contact email:', emailError);
    }
    res.status(201).json({
      message: 'Contact form submitted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      error: 'Failed to submit contact form',
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send message',
    });
  }
};

//get all contacts (admin)
export const getAllContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      contacts,
      count: contacts.length,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch contacts',
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};
