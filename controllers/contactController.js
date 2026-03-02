const nodemailer = require("nodemailer");

exports.sendContactEmail = async (req, res) => {
  try {
    const {
      name,
      email,
      organisation,
      category,
      message,
      stakeholder,
      domain,
      complexity
    } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `New Contact Request from ${name}`,
      html: `
        <h3>New Contact Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Organisation:</strong> ${organisation}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Stakeholder:</strong> ${stakeholder}</p>
        <p><strong>Domain:</strong> ${domain}</p>
        <p><strong>Complexity:</strong> ${complexity}</p>
        <hr/>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      routedTo: "Vasudheva Holdings Team",
      reason: "Your query has been sent to the appropriate department."
    });

  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false });
  }
};